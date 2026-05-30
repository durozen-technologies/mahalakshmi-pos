import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { requireOptionalNativeModule } from "expo-modules-core";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Button as TButton, Input, Spinner, XStack, YStack } from "tamagui";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import {
  createItem,
  createItemCategory,
  createShopItem,
  deleteItemCategory,
  fetchCatalogueItem,
  fetchItemCategories,
  fetchShopItem,
  updateItem,
  updateItemMetadata,
  updateShopItem,
  updateShopItemAllocation,
  updateShopItemMetadata,
} from "@/api/admin";
import { resolveApiUrl, toApiError } from "@/api/client";
import type { ItemCategoryRead, ItemMetadataUpdate, ShopItemRead, UUID } from "@/types/api";
import type { AdminItemEditorScreenProps } from "@/navigation/types";

import { getAdminPalette, type ThemePalette } from "./admin-dashboard-theme";
import { triggerHaptic } from "./admin-dashboard-utils";
import {
  AdminItemEditorMode,
  AdminItemWorkspace,
} from "./admin-items-model";

type ExpoImagePickerModule = typeof import("expo-image-picker");
type ExpoImagePickerNativeModule = {
  launchImageLibraryAsync?: unknown;
  requestMediaLibraryPermissionsAsync?: unknown;
};
type ImageDraft = {
  uri: string;
  name: string;
  type: string;
};

const ATTRIBUTE_VALUE_TYPES = ["text", "number", "boolean", "null"] as const;
type AttributeValueType = typeof ATTRIBUTE_VALUE_TYPES[number];

const attributeSchema = z
  .object({
    key: z.string().trim().min(1, "Key is required.").max(48, "Keep keys under 48 characters."),
    value: z.string().max(160, "Keep values under 160 characters."),
    valueType: z.enum(ATTRIBUTE_VALUE_TYPES),
  })
  .superRefine((row, context) => {
    if (row.valueType === "number" && !Number.isFinite(Number(row.value.trim()))) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Enter a valid number.",
      });
    }
  });

const editorSchema = z
  .object({
    name: z.string().trim().min(2, "Enter at least 2 characters.").max(120, "Name is too long."),
    tamilName: z.string().trim().min(1, "Tamil name is required.").max(120, "Tamil name is too long."),
    unitType: z.enum(["weight", "count"]),
    baseUnit: z.enum(["kg", "unit"]),
    isActive: z.boolean(),
    sortOrder: z.string().trim().regex(/^-?\d+$/, "Use a whole number."),
    categoryId: z.string(),
    category: z.string().max(80, "Category is too long."),
    attributes: z.array(attributeSchema),
  })
  .superRefine((values, context) => {
    if (values.unitType === "weight" && values.baseUnit !== "kg") {
      context.addIssue({
        code: "custom",
        path: ["baseUnit"],
        message: "Weight items must use KG.",
      });
    }
    if (values.unitType === "count" && values.baseUnit !== "unit") {
      context.addIssue({
        code: "custom",
        path: ["baseUnit"],
        message: "Count items must use Unit.",
      });
    }
    const keys = new Map<string, number>();
    values.attributes.forEach((row, index) => {
      const key = row.key.trim();
      if (!key) {
        return;
      }
      const existingIndex = keys.get(key);
      if (existingIndex !== undefined) {
        context.addIssue({
          code: "custom",
          path: ["attributes", index, "key"],
          message: `Duplicate key, already used in row ${existingIndex + 1}.`,
        });
      } else {
        keys.set(key, index);
      }
    });
  });

type EditorValues = z.infer<typeof editorSchema>;

const EMPTY_EDITOR: EditorValues = {
  name: "",
  tamilName: "",
  unitType: "weight",
  baseUnit: "kg",
  isActive: true,
  sortOrder: "0",
  categoryId: "",
  category: "",
  attributes: [],
};

async function loadImagePickerModule(): Promise<ExpoImagePickerModule | null> {
  const nativeImagePicker = requireOptionalNativeModule<ExpoImagePickerNativeModule>("ExponentImagePicker");
  if (!nativeImagePicker?.launchImageLibraryAsync || !nativeImagePicker.requestMediaLibraryPermissionsAsync) {
    return null;
  }
  try {
    return await import("expo-image-picker");
  } catch {
    return null;
  }
}

function appendReactNativeFile(formData: FormData, fieldName: string, file: ImageDraft) {
  formData.append(fieldName, file as unknown as Blob);
}

function attributesFromObject(attributes: ShopItemRead["custom_attributes"]): EditorValues["attributes"] {
  return Object.entries(attributes ?? {}).map(([key, value]) => {
    const valueType: AttributeValueType =
      value == null ? "null" : typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "text";
    return {
      key,
      value: value == null ? "" : String(value),
      valueType,
    };
  });
}

function attributesToObject(rows: EditorValues["attributes"]) {
  const output: Record<string, string | number | boolean | null> = {};
  const keys = new Set<string>();
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) {
      throw new Error("Attribute key is required.");
    }
    if (keys.has(key)) {
      throw new Error(`Duplicate attribute key: ${key}`);
    }
    keys.add(key);
    if (row.valueType === "number") {
      const value = Number(row.value.trim());
      if (!Number.isFinite(value)) {
        throw new Error(`${key} must be a valid number.`);
      }
      output[key] = value;
    } else if (row.valueType === "boolean") {
      output[key] = row.value === "true";
    } else if (row.valueType === "null") {
      output[key] = null;
    } else {
      output[key] = row.value;
    }
  }
  return output;
}

function valuesFromItem(item: ShopItemRead): EditorValues {
  return {
    name: item.name,
    tamilName: item.tamil_name ?? "",
    unitType: item.unit_type,
    baseUnit: item.base_unit,
    isActive: item.is_active,
    sortOrder: String(item.sort_order ?? 0),
    categoryId: item.category_id ?? "",
    category: item.category ?? "",
    attributes: attributesFromObject(item.custom_attributes),
  };
}

function buildFormData(values: EditorValues, imageDraft: ImageDraft | null, removeImage: boolean) {
  const formData = new FormData();
  formData.append("name", values.name.trim());
  formData.append("tamil_name", values.tamilName.trim());
  formData.append("unit_type", values.unitType);
  formData.append("base_unit", values.baseUnit);
  formData.append("is_active", String(values.isActive));
  formData.append("sort_order", values.sortOrder.trim() || "0");
  formData.append("category", values.category.trim());
  if (values.categoryId) {
    formData.append("category_id", values.categoryId);
  }
  formData.append("custom_attributes", JSON.stringify(attributesToObject(values.attributes)));
  formData.append("remove_image", String(removeImage && !imageDraft));
  if (imageDraft) {
    appendReactNativeFile(formData, "image", imageDraft);
  }
  return formData;
}

function buildMetadataPayload(
  values: EditorValues,
  customAttributes: Record<string, string | number | boolean | null>,
): ItemMetadataUpdate {
  const categoryId = values.categoryId.trim();
  return {
    name: values.name.trim(),
    tamil_name: values.tamilName.trim(),
    unit_type: values.unitType,
    base_unit: values.baseUnit,
    is_active: values.isActive,
    sort_order: Number(values.sortOrder || 0),
    category_id: categoryId || null,
    category: categoryId ? values.category.trim() || null : null,
    custom_attributes: customAttributes,
  };
}

function nextAttributeType(current: AttributeValueType): AttributeValueType {
  const index = ATTRIBUTE_VALUE_TYPES.indexOf(current);
  return ATTRIBUTE_VALUE_TYPES[(index + 1) % ATTRIBUTE_VALUE_TYPES.length];
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  const apiError = toApiError(error);
  return apiError.message || fallback;
}

export function AdminItemEditorScreen({ navigation, route }: AdminItemEditorScreenProps) {
  const colorScheme = useColorScheme();
  const palette = useMemo(() => getAdminPalette(colorScheme), [colorScheme]);
  const insets = useSafeAreaInsets();
  const { mode, workspace, itemId, shopId } = route.params;
  const isCreate = mode === AdminItemEditorMode.Create;
  const isCustomize = mode === AdminItemEditorMode.Customize;
  const [item, setItem] = useState<ShopItemRead | null>(null);
  const [imageDraft, setImageDraft] = useState<ImageDraft | null>(null);
  const [removeImageRequested, setRemoveImageRequested] = useState(false);
  const [categories, setCategories] = useState<ItemCategoryRead[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty, isValid },
  } = useForm<EditorValues>({
    defaultValues: EMPTY_EDITOR,
    resolver: zodResolver(editorSchema),
    mode: "onChange",
  });
  const { fields, append, remove } = useFieldArray({ control, name: "attributes" });
  const unitType = watch("unitType");
  const isActive = watch("isActive");
  const watchedAttributes = watch("attributes");
  const selectedCategoryId = watch("categoryId");

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const nextCategories = await fetchItemCategories();
      setCategories(nextCategories);
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, "Unable to load categories."));
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (isCreate || !itemId) {
      reset(EMPTY_EDITOR);
      setImageDraft(null);
      setRemoveImageRequested(false);
      return;
    }
    let alive = true;
    setLoading(true);
    const request =
      workspace === AdminItemWorkspace.Catalogue || !shopId
        ? fetchCatalogueItem(itemId)
        : fetchShopItem(shopId, itemId);
    void request
      .then((loadedItem) => {
        if (!alive) {
          return;
        }
        setItem(loadedItem);
        reset(valuesFromItem(loadedItem));
        setImageDraft(null);
        setRemoveImageRequested(false);
        setError(null);
      })
      .catch((requestError) => {
        if (alive) {
          setError(getRequestErrorMessage(requestError, "Unable to load item."));
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [isCreate, itemId, reset, shopId, workspace]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (saving || (!isDirty && !imageDraft && !removeImageRequested)) {
        return;
      }
      event.preventDefault();
      Alert.alert("Discard item changes?", "Unsaved item changes will be lost.", [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });
    return unsubscribe;
  }, [imageDraft, isDirty, navigation, removeImageRequested, saving]);

  const title = isCreate
    ? workspace === AdminItemWorkspace.Catalogue
      ? "Add catalogue item"
      : "Add shop item"
    : isCustomize
      ? "Customize shop item"
      : "Edit item";
  const currentImageUri = removeImageRequested ? "" : imageDraft?.uri ?? (item?.image_path ? resolveApiUrl(item.image_path) : "");
  const canEditSharedFields = !isCustomize;
  const customizationBlocked = isCustomize && item !== null && !item.allocated;

  const pickImage = useCallback(async () => {
    const imagePicker = await loadImagePickerModule();
    if (!imagePicker) {
      Alert.alert("Image picker unavailable", "Rebuild the app with expo-image-picker to upload item images.");
      return;
    }
    const permission = await imagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Allow photo access to upload item images.");
      return;
    }
    const result = await imagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    setRemoveImageRequested(false);
    setImageDraft({
      uri: asset.uri,
      name: asset.fileName ?? `item-${Date.now()}.jpg`,
      type: asset.mimeType ?? "image/jpeg",
    });
  }, []);

  const removeImage = useCallback(() => {
    if (imageDraft) {
      setImageDraft(null);
      return;
    }
    if (removeImageRequested) {
      setRemoveImageRequested(false);
      return;
    }
    if (!itemId || !item?.image_path) {
      setImageDraft(null);
      return;
    }
    Alert.alert("Remove item image", `Remove the stored image for ${item.name} when you save?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove on save",
        style: "destructive",
        onPress: () => setRemoveImageRequested(true),
      },
    ]);
  }, [imageDraft, item, itemId, removeImageRequested]);

  const addCategory = useCallback(async () => {
    const categoryName = categoryDraft.trim();
    if (!categoryName) {
      triggerHaptic();
      setError("Enter a category name.");
      return;
    }
    setCategoriesLoading(true);
    setError(null);
    try {
      const createdCategory = await createItemCategory({ name: categoryName });
      setCategories((current) => [...current, createdCategory].sort((left, right) => left.name.localeCompare(right.name)));
      setCategoryDraft("");
      setValue("categoryId", createdCategory.id, { shouldDirty: true, shouldValidate: true });
      setValue("category", createdCategory.name, { shouldDirty: true, shouldValidate: true });
    } catch (requestError) {
      triggerHaptic();
      setError(getRequestErrorMessage(requestError, "Unable to create category."));
    } finally {
      setCategoriesLoading(false);
    }
  }, [categoryDraft, setValue]);

  const removeCategory = useCallback(async (category: ItemCategoryRead) => {
    Alert.alert("Delete category", `Delete ${category.name}? Items using it will become uncategorized.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setCategoriesLoading(true);
            setError(null);
            try {
              await deleteItemCategory(category.id);
              setCategories((current) => current.filter((candidate) => candidate.id !== category.id));
              if (selectedCategoryId === category.id) {
                setValue("categoryId", "", { shouldDirty: true, shouldValidate: true });
                setValue("category", "", { shouldDirty: true, shouldValidate: true });
              }
            } catch (requestError) {
              triggerHaptic();
              setError(getRequestErrorMessage(requestError, "Unable to delete category."));
            } finally {
              setCategoriesLoading(false);
            }
          })();
        },
      },
    ]);
  }, [selectedCategoryId, setValue]);

  const submit = handleSubmit(async (values) => {
    let customAttributes: Record<string, string | number | boolean | null>;
    try {
      customAttributes = attributesToObject(values.attributes);
    } catch (requestError) {
      triggerHaptic();
      setError(requestError instanceof Error ? requestError.message : "Invalid custom attributes.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isCustomize) {
        if (!shopId || !itemId) {
          throw new Error("Shop and item are required for customization.");
        }
        if (customizationBlocked) {
          throw new Error("Allocate this item to the shop before customizing it.");
        }
        await updateShopItemAllocation(shopId, itemId, {
          display_name: values.name.trim(),
          tamil_name: values.tamilName.trim(),
          is_active: values.isActive,
          sort_order: Number(values.sortOrder || 0),
          custom_attributes: customAttributes,
        });
      } else if (isCreate) {
        const payload = buildFormData(values, imageDraft, false);
        if (workspace === AdminItemWorkspace.Catalogue) {
          await createItem(payload);
        } else {
          if (!shopId) {
            throw new Error("Select a shop before creating a shop item.");
          }
          await createShopItem(shopId, payload);
        }
      } else {
        if (!itemId) {
          throw new Error("Item is required for editing.");
        }
        const hasImageChange = Boolean(imageDraft || removeImageRequested);
        if (workspace === AdminItemWorkspace.Catalogue || !shopId) {
          if (hasImageChange) {
            await updateItem(itemId, buildFormData(values, imageDraft, removeImageRequested));
          } else {
            await updateItemMetadata(itemId, buildMetadataPayload(values, customAttributes));
          }
        } else {
          if (hasImageChange) {
            await updateShopItem(shopId, itemId, buildFormData(values, imageDraft, removeImageRequested));
          } else {
            await updateShopItemMetadata(shopId, itemId, buildMetadataPayload(values, customAttributes));
          }
        }
      }
      reset(values);
      setImageDraft(null);
      setRemoveImageRequested(false);
      if (workspace === AdminItemWorkspace.Catalogue) {
        navigation.navigate("AdminItemsCatalogue");
      } else {
        navigation.navigate("AdminShopItems", { shopId });
      }
    } catch (requestError) {
      triggerHaptic();
      setError(getRequestErrorMessage(requestError, "Unable to save item."));
    } finally {
      setSaving(false);
    }
  }, () => {
    triggerHaptic();
    setError("Fix the highlighted fields before saving.");
  });

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]} edges={["top", "left", "right"]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={[styles.topBar, { borderBottomColor: palette.border, paddingTop: Math.max(insets.top - 8, 0) }]}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={palette.textPrimary} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={[styles.title, { color: palette.textPrimary }]}>
            {title}
          </Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: palette.textMuted }]}>
            {isCustomize ? "Shop-only overrides" : "Names, units, image, and category"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Spinner color={palette.emerald} />
          <Text style={[styles.helper, { color: palette.textMuted }]}>Loading item...</Text>
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: 34 + insets.bottom }]}
        >
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: palette.dangerSoft, borderColor: palette.danger }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={palette.danger} />
              <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
            </View>
          ) : null}
          {customizationBlocked ? (
            <View style={[styles.errorBox, { backgroundColor: palette.dangerSoft, borderColor: palette.danger }]}>
              <MaterialCommunityIcons name="link-variant-off" size={18} color={palette.danger} />
              <Text style={[styles.errorText, { color: palette.danger }]}>
                Allocate this item to the shop before customizing shop-only fields.
              </Text>
            </View>
          ) : null}

          {canEditSharedFields ? (
            <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <View style={[styles.imagePreview, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}>
                {currentImageUri ? (
                  <Image source={{ uri: currentImageUri }} contentFit="cover" style={StyleSheet.absoluteFill} />
                ) : (
                  <MaterialCommunityIcons name="image-plus" size={30} color={palette.textMuted} />
                )}
              </View>
              <YStack flex={1} gap={8}>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Image</Text>
                <Text style={[styles.sectionHint, { color: palette.textMuted }]}>Square image for admin and billing item rows.</Text>
                <XStack gap={8} flexWrap="wrap">
                  <EditorButton label="Pick image" icon="image-edit-outline" onPress={pickImage} palette={palette} />
                  {imageDraft || currentImageUri || removeImageRequested ? (
                    <EditorButton
                      label={removeImageRequested ? "Undo remove" : imageDraft ? "Clear" : "Remove"}
                      icon="image-remove-outline"
                      onPress={removeImage}
                      palette={palette}
                      danger
                    />
                  ) : null}
                </XStack>
              </YStack>
            </View>
          ) : (
            <View style={[styles.infoBox, { borderColor: palette.gold, backgroundColor: palette.goldSoft }]}>
              <MaterialCommunityIcons name="information-outline" size={18} color={palette.cash} />
              <Text style={[styles.infoText, { color: palette.textPrimary }]}>
                Shared image, unit, and category fields stay in Catalogue.
              </Text>
            </View>
          )}

          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <EditorField
                label="English name"
                value={field.value}
                placeholder="Chicken curry cut"
                errorText={errors.name?.message}
                onChangeText={field.onChange}
                palette={palette}
              />
            )}
          />
          <Controller
            control={control}
            name="tamilName"
            render={({ field }) => (
              <EditorField
                label="Tamil name"
                value={field.value}
                placeholder="தமிழ் பெயர்"
                errorText={errors.tamilName?.message}
                onChangeText={field.onChange}
                palette={palette}
              />
            )}
          />

          {canEditSharedFields ? (
            <>
              <XStack gap={8}>
                <EditorButton
                  label="Weight"
                  icon="scale-balance"
                  active={unitType === "weight"}
                  onPress={() => {
                    setValue("unitType", "weight", { shouldDirty: true, shouldValidate: true });
                    setValue("baseUnit", "kg", { shouldDirty: true, shouldValidate: true });
                  }}
                  palette={palette}
                  flex
                />
                <EditorButton
                  label="Count"
                  icon="counter"
                  active={unitType === "count"}
                  onPress={() => {
                    setValue("unitType", "count", { shouldDirty: true, shouldValidate: true });
                    setValue("baseUnit", "unit", { shouldDirty: true, shouldValidate: true });
                  }}
                  palette={palette}
                  flex
                />
              </XStack>
              <CategoryManager
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                draftName={categoryDraft}
                loading={categoriesLoading}
                palette={palette}
                onChangeDraftName={setCategoryDraft}
                onSelect={(category) => {
                  setValue("categoryId", category?.id ?? "", { shouldDirty: true, shouldValidate: true });
                  setValue("category", category?.name ?? "", { shouldDirty: true, shouldValidate: true });
                }}
                onAdd={() => void addCategory()}
                onDelete={removeCategory}
              />
            </>
          ) : null}

          <XStack gap={10}>
            <EditorButton label="Cancel" icon="close-circle-outline" onPress={() => navigation.goBack()} palette={palette} flex />
            <EditorButton
              label={saving ? "Saving..." : "Save item"}
              icon="content-save-outline"
              onPress={() => void submit()}
              palette={palette}
              active
              loading={saving}
              disabled={!isValid || customizationBlocked}
              flex
            />
          </XStack>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function EditorField({
  label,
  value,
  placeholder,
  keyboardType,
  multiline,
  errorText,
  palette,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  keyboardType?: "default" | "number-pad";
  multiline?: boolean;
  errorText?: string;
  palette: ThemePalette;
  onChangeText: (value: string) => void;
}) {
  return (
    <YStack gap={7}>
      <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>{label}</Text>
      <Input
        value={value}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted as never}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        minHeight={multiline ? 92 : 48}
        borderRadius={12}
        borderWidth={1}
        borderColor={errorText ? palette.danger : palette.border}
        backgroundColor={palette.surfaceMuted}
        color={palette.textPrimary}
        fontSize={15}
        fontWeight="700"
      />
      {errorText ? <Text style={[styles.fieldError, { color: palette.danger }]}>{errorText}</Text> : null}
    </YStack>
  );
}

function CategoryManager({
  categories,
  selectedCategoryId,
  draftName,
  loading,
  palette,
  onChangeDraftName,
  onSelect,
  onAdd,
  onDelete,
}: {
  categories: ItemCategoryRead[];
  selectedCategoryId: UUID | "";
  draftName: string;
  loading: boolean;
  palette: ThemePalette;
  onChangeDraftName: (value: string) => void;
  onSelect: (category: ItemCategoryRead | null) => void;
  onAdd: () => void;
  onDelete: (category: ItemCategoryRead) => void;
}) {
  return (
    <View style={[styles.categoryPanel, { borderColor: palette.border, backgroundColor: palette.card }]}>
      <XStack alignItems="center" justifyContent="space-between" gap={10}>
        <YStack flex={1} minWidth={0}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Category</Text>
          <Text style={[styles.sectionHint, { color: palette.textMuted }]}>
            Create the catalogue groups users need, then choose one for this item.
          </Text>
        </YStack>
        {loading ? <Spinner color={palette.emerald} size="small" /> : null}
      </XStack>

      <XStack gap={8} alignItems="center">
        <Input
          value={draftName}
          placeholder="New category"
          placeholderTextColor={palette.textMuted as never}
          onChangeText={onChangeDraftName}
          flex={1}
          minHeight={42}
          borderRadius={10}
          borderWidth={1}
          borderColor={palette.border}
          backgroundColor={palette.surfaceMuted}
          color={palette.textPrimary}
          fontSize={14}
          fontWeight="800"
        />
        <EditorButton label="Add" icon="plus" onPress={onAdd} palette={palette} disabled={loading} />
      </XStack>

      <XStack gap={8} flexWrap="wrap">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selectedCategoryId === "" }}
          onPress={() => onSelect(null)}
          style={[
            styles.categoryChip,
            {
              borderColor: selectedCategoryId === "" ? palette.emerald : palette.border,
              backgroundColor: selectedCategoryId === "" ? palette.emeraldSoft : palette.surfaceMuted,
            },
          ]}
        >
          <Text
            style={[
              styles.categoryChipText,
              { color: selectedCategoryId === "" ? palette.emeraldDark : palette.textPrimary },
            ]}
          >
            None
          </Text>
        </Pressable>
        {categories.map((category) => {
          const selected = selectedCategoryId === category.id;
          return (
            <View
              key={category.id}
              style={[
                styles.categoryChip,
                {
                  borderColor: selected ? palette.emerald : palette.border,
                  backgroundColor: selected ? palette.emeraldSoft : palette.surfaceMuted,
                },
              ]}
            >
              <Pressable accessibilityRole="button" onPress={() => onSelect(category)} style={styles.categoryChipLabel}>
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: selected ? palette.emeraldDark : palette.textPrimary },
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => onDelete(category)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={15} color={palette.danger} />
              </Pressable>
            </View>
          );
        })}
      </XStack>
    </View>
  );
}

function AttributeEditor({
  fields,
  control,
  watchedAttributes,
  palette,
  onAppend,
  onRemove,
  onCycleType,
  onToggleBoolean,
}: {
  fields: { id: string }[];
  control: ReturnType<typeof useForm<EditorValues>>["control"];
  watchedAttributes: EditorValues["attributes"];
  palette: ThemePalette;
  onAppend: () => void;
  onRemove: (index: number) => void;
  onCycleType: (index: number, valueType: AttributeValueType) => void;
  onToggleBoolean: (index: number, currentValue: string) => void;
}) {
  return (
    <View style={[styles.attributesPanel, { borderColor: palette.border, backgroundColor: palette.card }]}>
      <XStack alignItems="center" justifyContent="space-between" gap={10}>
        <YStack flex={1} minWidth={0}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Custom attributes</Text>
          <Text style={[styles.sectionHint, { color: palette.textMuted }]}>Typed key/value details for future filtering and shop customization.</Text>
        </YStack>
        <EditorButton label="Add" icon="plus" onPress={onAppend} palette={palette} />
      </XStack>

      {fields.length === 0 ? (
        <View style={[styles.emptyAttributes, { backgroundColor: palette.surfaceMuted }]}>
          <Text style={[styles.sectionHint, { color: palette.textMuted }]}>No attributes yet.</Text>
        </View>
      ) : (
        <YStack gap={9}>
          {fields.map((field, index) => {
            const valueType = watchedAttributes[index]?.valueType ?? "text";
            const value = watchedAttributes[index]?.value ?? "";
            return (
              <View key={field.id} style={[styles.attributeRow, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}>
                <Controller
                  control={control}
                  name={`attributes.${index}.key`}
                  render={({ field: keyField, fieldState }) => (
                    <View style={styles.attributeKey}>
                      <Input
                        value={keyField.value}
                        placeholder="Key"
                        placeholderTextColor={palette.textMuted as never}
                        onChangeText={keyField.onChange}
                        minHeight={40}
                        borderRadius={10}
                        borderWidth={1}
                        borderColor={fieldState.error ? palette.danger : palette.border}
                        backgroundColor={palette.card}
                        color={palette.textPrimary}
                        fontSize={13}
                        fontWeight="800"
                      />
                    </View>
                  )}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onCycleType(index, valueType)}
                  style={[styles.typeButton, { borderColor: palette.border, backgroundColor: palette.card }]}
                >
                  <Text style={[styles.typeText, { color: palette.textPrimary }]}>
                    {valueType === "text" ? "Text" : valueType === "number" ? "Number" : valueType === "boolean" ? "Bool" : "Null"}
                  </Text>
                </Pressable>
                {valueType === "boolean" ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onToggleBoolean(index, value)}
                    style={[styles.booleanButton, { borderColor: palette.emerald, backgroundColor: palette.emeraldSoft }]}
                  >
                    <Text style={[styles.typeText, { color: palette.emeraldDark }]}>
                      {value === "false" ? "False" : "True"}
                    </Text>
                  </Pressable>
                ) : valueType === "null" ? (
                  <View style={[styles.nullValue, { borderColor: palette.border, backgroundColor: palette.card }]}>
                    <Text style={[styles.typeText, { color: palette.textMuted }]}>Null</Text>
                  </View>
                ) : (
                  <Controller
                    control={control}
                    name={`attributes.${index}.value`}
                    render={({ field: valueField, fieldState }) => (
                      <Input
                        value={valueField.value}
                        placeholder="Value"
                        placeholderTextColor={palette.textMuted as never}
                        keyboardType={valueType === "number" ? "decimal-pad" : "default"}
                        onChangeText={valueField.onChange}
                        flex={1}
                        minHeight={40}
                        borderRadius={10}
                        borderWidth={1}
                        borderColor={fieldState.error ? palette.danger : palette.border}
                        backgroundColor={palette.card}
                        color={palette.textPrimary}
                        fontSize={13}
                        fontWeight="800"
                      />
                    )}
                  />
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onRemove(index)}
                  style={styles.removeAttributeButton}
                >
                  <MaterialCommunityIcons name="close" size={18} color={palette.danger} />
                </Pressable>
              </View>
            );
          })}
        </YStack>
      )}
    </View>
  );
}

function EditorButton({
  label,
  icon,
  active,
  danger,
  loading,
  disabled,
  flex,
  palette,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  active?: boolean;
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
  flex?: boolean;
  palette: ThemePalette;
  onPress: () => void;
}) {
  const backgroundColor = active ? palette.emerald : danger ? palette.dangerSoft : palette.card;
  const borderColor = active ? palette.emerald : danger ? palette.danger : palette.border;
  const textColor = active ? "#FFFFFF" : danger ? palette.danger : palette.textPrimary;
  return (
    <TButton
      accessibilityRole="button"
      onPress={onPress}
      disabled={loading || disabled}
      flex={flex ? 1 : undefined}
      minHeight={44}
      borderRadius={12}
      borderWidth={1}
      borderColor={borderColor}
      backgroundColor={backgroundColor}
      opacity={disabled ? 0.56 : 1}
      pressStyle={{ opacity: 0.9, scale: 0.98 }}
    >
      {loading ? (
        <Spinner color={textColor} />
      ) : (
        <XStack gap={7} alignItems="center" justifyContent="center">
          <MaterialCommunityIcons name={icon} size={17} color={textColor} />
          <Text numberOfLines={1} style={[styles.buttonText, { color: textColor }]}>{label}</Text>
        </XStack>
      )}
    </TButton>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    minHeight: 62,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  content: {
    gap: 14,
    padding: 16,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  imagePreview: {
    width: 88,
    height: 88,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 9,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  sectionHint: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  fieldError: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "900",
    flexShrink: 1,
  },
  helper: {
    fontSize: 13,
    fontWeight: "700",
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },
  categoryPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  categoryChip: {
    minHeight: 34,
    maxWidth: "100%",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryChipLabel: {
    minHeight: 32,
    justifyContent: "center",
  },
  categoryChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
  },
  attributesPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  emptyAttributes: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  attributeRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  attributeKey: {
    flex: 1,
    minWidth: 82,
  },
  typeButton: {
    minWidth: 64,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  booleanButton: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  nullValue: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  typeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
  },
  removeAttributeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
