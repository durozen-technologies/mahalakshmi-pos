import {
  type ComponentProps,
  type ElementRef,
  forwardRef,
  type ReactNode,
} from "react";
import {
  ActivityIndicator as NativeActivityIndicator,
  Pressable as NativePressable,
  ScrollView as NativeScrollView,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  View as NativeView,
  type ActivityIndicatorProps,
  type GestureResponderEvent,
  type ModalProps,
  type PressableStateCallbackType,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { cn } from "@/utils/cn";

type AnyProps = Record<string, any>;
type InputStyleProps = Partial<
  Record<
    | "backgroundColor"
    | "borderColor"
    | "borderRadius"
    | "borderWidth"
    | "color"
    | "flex"
    | "fontSize"
    | "fontWeight"
    | "height"
    | "lineHeight"
    | "margin"
    | "marginBottom"
    | "marginHorizontal"
    | "marginTop"
    | "marginVertical"
    | "maxHeight"
    | "maxWidth"
    | "minHeight"
    | "minWidth"
    | "opacity"
    | "padding"
    | "paddingBottom"
    | "paddingHorizontal"
    | "paddingLeft"
    | "paddingRight"
    | "paddingTop"
    | "paddingVertical"
    | "textAlign"
    | "width",
    any
  >
> & {
  className?: string;
  unstyled?: boolean;
};

const stylePropNames = new Set([
  "alignContent",
  "alignItems",
  "alignSelf",
  "aspectRatio",
  "backfaceVisibility",
  "backgroundColor",
  "borderBottomColor",
  "borderBottomEndRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "borderBottomStartRadius",
  "borderBottomWidth",
  "borderColor",
  "borderCurve",
  "borderEndColor",
  "borderEndWidth",
  "borderLeftColor",
  "borderLeftWidth",
  "borderRadius",
  "borderRightColor",
  "borderRightWidth",
  "borderStartColor",
  "borderStartWidth",
  "borderStyle",
  "borderTopColor",
  "borderTopEndRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderTopStartRadius",
  "borderTopWidth",
  "borderWidth",
  "bottom",
  "boxShadow",
  "color",
  "columnGap",
  "cursor",
  "direction",
  "display",
  "elevation",
  "end",
  "flex",
  "flexBasis",
  "flexDirection",
  "flexGrow",
  "flexShrink",
  "flexWrap",
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "gap",
  "height",
  "includeFontPadding",
  "justifyContent",
  "left",
  "letterSpacing",
  "lineHeight",
  "margin",
  "marginBlock",
  "marginBlockEnd",
  "marginBlockStart",
  "marginBottom",
  "marginEnd",
  "marginHorizontal",
  "marginInline",
  "marginInlineEnd",
  "marginInlineStart",
  "marginLeft",
  "marginRight",
  "marginStart",
  "marginTop",
  "marginVertical",
  "maxHeight",
  "maxWidth",
  "minHeight",
  "minWidth",
  "objectFit",
  "opacity",
  "overflow",
  "overlayColor",
  "padding",
  "paddingBlock",
  "paddingBlockEnd",
  "paddingBlockStart",
  "paddingBottom",
  "paddingEnd",
  "paddingHorizontal",
  "paddingInline",
  "paddingInlineEnd",
  "paddingInlineStart",
  "paddingLeft",
  "paddingRight",
  "paddingStart",
  "paddingTop",
  "paddingVertical",
  "pointerEvents",
  "position",
  "resizeMode",
  "right",
  "role",
  "rowGap",
  "scale",
  "shadowColor",
  "shadowOffset",
  "shadowOpacity",
  "shadowRadius",
  "start",
  "textAlign",
  "textAlignVertical",
  "textDecorationColor",
  "textDecorationLine",
  "textDecorationStyle",
  "textShadowColor",
  "textShadowOffset",
  "textShadowRadius",
  "textTransform",
  "tintColor",
  "top",
  "transform",
  "transformOrigin",
  "verticalAlign",
  "width",
  "zIndex",
]);

const propAliases: Record<string, string> = {
  bg: "backgroundColor",
  background: "backgroundColor",
  bc: "borderColor",
  br: "borderRadius",
  h: "height",
  m: "margin",
  mb: "marginBottom",
  ml: "marginLeft",
  mr: "marginRight",
  mt: "marginTop",
  mx: "marginHorizontal",
  my: "marginVertical",
  p: "padding",
  pb: "paddingBottom",
  pl: "paddingLeft",
  pr: "paddingRight",
  pt: "paddingTop",
  px: "paddingHorizontal",
  py: "paddingVertical",
  w: "width",
};

const ignoredPropNames = new Set([
  "animation",
  "chromeless",
  "enterStyle",
  "exitStyle",
  "focusStyle",
  "hoverStyle",
  "pressStyle",
  "theme",
  "unstyled",
]);

type GluestackUIProviderProps = {
  children: ReactNode;
  config?: unknown;
  mode?: "light" | "dark" | "system";
};

export function GluestackUIProvider({ children }: GluestackUIProviderProps) {
  return <>{children}</>;
}

function toNativeStyle(rawStyle: AnyProps): ViewStyle {
  const { scale, transform, ...style } = rawStyle;
  if (scale === undefined) {
    return rawStyle as ViewStyle;
  }
  return {
    ...style,
    transform: [...(Array.isArray(transform) ? transform : []), { scale }],
  } as ViewStyle;
}

function splitProps(props: AnyProps) {
  const styleProps: AnyProps = {};
  const elementProps: AnyProps = {};

  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("$") || ignoredPropNames.has(key)) {
      continue;
    }

    const styleKey = propAliases[key] ?? key;
    if (stylePropNames.has(styleKey)) {
      styleProps[styleKey] = value;
      continue;
    }

    elementProps[key] = value;
  }

  return {
    elementProps,
    style: toNativeStyle(styleProps),
  };
}

function mergeStyleProps(props: AnyProps, baseStyle?: StyleProp<ViewStyle>) {
  const {
    children,
    className,
    style,
    ...rest
  } = props;
  const split = splitProps(rest);
  return {
    children,
    className,
    rest: split.elementProps,
    style: [baseStyle, split.style, style],
  };
}

export const Box = forwardRef<NativeView, AnyProps>(function Box(props, ref) {
  const { children, className, rest, style } = mergeStyleProps(props);
  return (
    <NativeView ref={ref} className={className} style={style} {...rest}>
      {children}
    </NativeView>
  );
});

export const View = Box;

export const HStack = forwardRef<NativeView, AnyProps>(function HStack(props, ref) {
  const { children, className, rest, style } = mergeStyleProps(props, { flexDirection: "row" });
  return (
    <NativeView ref={ref} className={className} style={style} {...rest}>
      {children}
    </NativeView>
  );
});

export const VStack = forwardRef<NativeView, AnyProps>(function VStack(props, ref) {
  const { children, className, rest, style } = mergeStyleProps(props, { flexDirection: "column" });
  return (
    <NativeView ref={ref} className={className} style={style} {...rest}>
      {children}
    </NativeView>
  );
});

export const XStack = HStack;
export const YStack = VStack;

export const Card = forwardRef<NativeView, AnyProps>(function Card(props, ref) {
  const { children, className, rest, style } = mergeStyleProps(props);
  return (
    <NativeView ref={ref} className={className} style={style} {...rest}>
      {children}
    </NativeView>
  );
});

export const Text = forwardRef<NativeText, AnyProps>(function Text(props, ref) {
  const { children, className, rest, style } = mergeStyleProps(props);
  return (
    <NativeText ref={ref} className={className} style={style} {...rest}>
      {children}
    </NativeText>
  );
});

type PressableStyle =
  | StyleProp<ViewStyle>
  | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);

type AliasStyleProps = Partial<
  Record<
    | "bg"
    | "background"
    | "bc"
    | "br"
    | "h"
    | "m"
    | "mb"
    | "ml"
    | "mr"
    | "mt"
    | "mx"
    | "my"
    | "p"
    | "pb"
    | "pl"
    | "pr"
    | "pt"
    | "px"
    | "py"
    | "w",
    unknown
  >
>;

type ButtonProps = Omit<
  ComponentProps<typeof NativePressable>,
  "children" | "disabled" | "onPress" | "style"
> &
  InputStyleProps &
  Partial<ViewStyle> &
  AliasStyleProps & {
  children?: ReactNode | ((state: PressableStateCallbackType) => ReactNode);
  className?: string;
  disabled?: boolean | null;
  isDisabled?: boolean | null;
  onPress?: (event: GestureResponderEvent) => void;
  pressStyle?: ViewStyle & { scale?: number };
  style?: PressableStyle;
};

export const Pressable = forwardRef<ElementRef<typeof NativePressable>, ButtonProps>(function Pressable(
  {
    children,
    className,
    disabled,
    isDisabled,
    onPress,
    pressStyle,
    style,
    ...restProps
  },
  ref,
) {
  const split = splitProps(restProps as AnyProps);
  const resolvedDisabled = disabled || isDisabled;
  const resolvedPressStyle = pressStyle ? toNativeStyle(pressStyle) : undefined;

  return (
    <NativePressable
      ref={ref as never}
      className={className}
      disabled={resolvedDisabled}
      onPress={onPress}
      style={(state: PressableStateCallbackType) => [
        split.style,
        typeof style === "function" ? style(state) : style,
        state.pressed && resolvedPressStyle,
      ]}
      {...split.elementProps}
    >
      {children}
    </NativePressable>
  );
});

export const Button = forwardRef<ElementRef<typeof NativePressable>, ButtonProps>(function Button(
  props,
  ref,
) {
  return (
    <Pressable
      ref={ref}
      {...props}
      className={cn("flex-row items-center justify-center", props.className)}
    />
  );
});

export const ButtonText = Text;
export const ButtonIcon = Box;
export const ButtonGroup = HStack;

export function ButtonSpinner(props: ActivityIndicatorProps) {
  return <NativeActivityIndicator {...props} />;
}

export const Spinner = forwardRef<NativeActivityIndicator, ActivityIndicatorProps>(function Spinner(
  { color, size = "small", ...props },
  ref,
) {
  return <NativeActivityIndicator ref={ref} color={color} size={size} {...props} />;
});

export const ActivityIndicator = Spinner;

type InputProps = TextInputProps & InputStyleProps & {
  disabled?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
};

export const Input = forwardRef<NativeTextInput, InputProps>(function Input(
  {
    className,
    disabled,
    editable,
    isDisabled,
    isReadOnly,
    style,
    ...restProps
  },
  ref,
) {
  const split = splitProps(restProps);
  return (
    <NativeTextInput
      ref={ref}
      className={className}
      editable={editable ?? (!disabled && !isDisabled && !isReadOnly)}
      style={[split.style, style]}
      underlineColorAndroid="transparent"
      {...split.elementProps}
    />
  );
});

export const InputField = Input;
export const TextInput = Input;
export const InputIcon = Box;

export const InputSlot = forwardRef<ElementRef<typeof NativePressable>, AnyProps>(function InputSlot(
  { children, className, disabled, isDisabled, onPress, style, ...restProps },
  ref,
) {
  const split = splitProps(restProps);
  return (
    <NativePressable
      ref={ref as never}
      className={className}
      disabled={disabled || isDisabled}
      onPress={onPress}
      style={[split.style, style]}
      {...split.elementProps}
    >
      {children}
    </NativePressable>
  );
});

export const ScrollView = forwardRef<NativeScrollView, AnyProps>(function ScrollView(
  {
    children,
    className,
    contentContainerClassName,
    contentContainerStyle,
    style,
    ...restProps
  },
  ref,
) {
  const split = splitProps(restProps);
  return (
    <NativeScrollView
      ref={ref}
      className={className}
      contentContainerClassName={contentContainerClassName}
      contentContainerStyle={contentContainerStyle}
      style={[split.style, style]}
      {...split.elementProps}
    >
      {children}
    </NativeScrollView>
  );
});

export const Divider = forwardRef<NativeView, AnyProps>(function Divider(
  {
    className,
    orientation = "horizontal",
    style,
    ...restProps
  },
  ref,
) {
  const split = splitProps(restProps);
  const baseStyle =
    orientation === "vertical"
      ? { width: StyleSheet.hairlineWidth, height: "100%" as const }
      : { height: StyleSheet.hairlineWidth, width: "100%" as const };
  const backgroundColor = split.style.borderColor ?? split.style.backgroundColor ?? "#E5E7EB";

  return (
    <NativeView
      ref={ref}
      className={className}
      style={[baseStyle, { backgroundColor }, split.style, style]}
      {...split.elementProps}
    />
  );
});

export const Separator = Divider;

export const Center = forwardRef<NativeView, AnyProps>(function Center(props, ref) {
  const { children, className, rest, style } = mergeStyleProps(props, {
    alignItems: "center",
    justifyContent: "center",
  });
  return (
    <NativeView ref={ref} className={className} style={style} {...rest}>
      {children}
    </NativeView>
  );
});

export const Heading = Text;

export const Badge = forwardRef<NativeView, AnyProps>(function Badge(props, ref) {
  const { children, className, rest, style } = mergeStyleProps(props);
  return (
    <NativeView ref={ref} className={cn("flex-row items-center", className)} style={style} {...rest}>
      {children}
    </NativeView>
  );
});

export const BadgeText = Text;
export const BadgeIcon = Box;

export const Skeleton = forwardRef<NativeView, AnyProps>(function Skeleton(props, ref) {
  const { className, rest, style } = mergeStyleProps(props);
  return (
    <NativeView
      ref={ref}
      className={cn("overflow-hidden", className)}
      style={[{ backgroundColor: "#E5E7EB" }, style]}
      {...rest}
    />
  );
});

export const Textarea = Input;
export const TextareaInput = Input;

export const Switch = Pressable;
export const Checkbox = Pressable;
export const Radio = Pressable;

export type { ModalProps };
