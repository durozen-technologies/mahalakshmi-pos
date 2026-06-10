---
title: Portal
description: A component that renders content outside the parent component's DOM hierarchy.
---

# Portal

Portal is a component that renders content outside the parent component's DOM hierarchy while maintaining styling and context with className support.

```jsx
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { CloseIcon } from "@/components/ui/icon";
import React from "react";
import { Portal } from "@/components/ui/portal";

function Example() {
  const [visible, setVisible] = React.useState(false);
  const handleClose = () => setVisible(false);

  return (
    <>
      <Portal isOpen={visible} className="justify-center items-center">
        <HStack className="border-2 w-1/3 py-10 gap-4 rounded-lg flex-row justify-center items-center bg-background-0">
          <Text className="text-typography-950">Portal Content</Text>
          <Button
            size="xs"
            className="h-6 px-1 absolute top-2 right-2"
            variant="outline"
            onPress={handleClose}
          >
            <ButtonIcon as={CloseIcon} />
          </Button>
        </HStack>
      </Portal>

      <Button onPress={() => setVisible(!visible)}>
        <ButtonText>Toggle Portal</ButtonText>
      </Button>
    </>
  );
}
```

> **Important**: The Portal component requires a parent component wrapped in GluestackUIProvider or OverlayProvider since it uses React context.

## Props

### Portal

- **isOpen**: boolean - If true, the portal will open
- **isKeyboardDismissable**: boolean - If true, the keyboard can dismiss the portal
- **useRNModal**: boolean (default: `false`) - If true, renders react-native native modal
- **useRNModalOnAndroid**: boolean (default: `false`) - If true, renders react-native native modal only in Android
- **onRequestClose**: ((event: NativeSyntheticEvent<any>) => void) | undefined - Callback called when the user taps hardware back button on Android or menu button on Apple TV (required on these platforms when useRNModal is true)
- **animationPreset**: `fade` | `slide` | `none` (default: `fade`) - The animation preset for the portal

> **Note**: While the Portal component can be used to create modals, popovers, menus, tooltips, or other components rendered outside the parent hierarchy, it's recommended to use the specialized Modal, Popover, Menu, and Tooltip components as they include built-in accessibility handling.
