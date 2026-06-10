---
title: AlertDialog
description: A dialog component that interrupts users with important content requiring immediate attention and action
---

# AlertDialog

AlertDialog is a modal component that interrupts users with important content requiring immediate attention and action. It provides a responsive interface for confirmations, alerts, and critical user decisions with className styling support.

```jsx
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  AlertDialogBackdrop,
} from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import React from "react";

function Example() {
  const [showAlertDialog, setShowAlertDialog] = React.useState(false);
  const handleClose = () => setShowAlertDialog(false);

  return (
    <>
      <Button onPress={() => setShowAlertDialog(true)}>
        <ButtonText>Open Dialog</ButtonText>
      </Button>
      <AlertDialog isOpen={showAlertDialog} onClose={handleClose} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading className="text-typography-950 font-semibold" size="md">
              Are you sure you want to delete this post?
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody className="mt-3 mb-4">
            <Text size="sm">
              Deleting the post will remove it permanently and cannot be undone.
              Please confirm if you want to proceed.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              variant="outline"
              action="secondary"
              onPress={handleClose}
              size="sm"
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button size="sm" onPress={handleClose}>
              <ButtonText>Delete</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

## Props

### AlertDialog

- **size**: `xs` | `sm` | `md` | `lg` | `full` (default: `md`)
- **isOpen**: boolean (default: `false`) - If true, the alert-dialog will open
- **onClose**: () => any - Callback invoked when the alert-dialog is closed
- **useRNModal**: boolean (default: `false`) - If true, renders react-native native modal (Only works in react-native)
- **defaultIsOpen**: boolean (default: `false`) - Specifies the default open state of the AlertDialog
- **initialFocusRef**: React.RefObject<any> - The ref of element to receive focus when the alert-dialog opens
- **finalFocusRef**: React.RefObject<any> - The ref of element to receive focus when the alert-dialog closes
- **avoidKeyboard**: boolean - If true, the AlertDialog will avoid the keyboard
- **closeOnOverlayClick**: boolean (default: `true`) - If true, the AlertDialog will close when the overlay is clicked
- **isKeyboardDismissable**: boolean (default: `true`) - If true, the keyboard can dismiss the AlertDialog

Inherits all the properties of React Native's View component.

### AlertDialogBackdrop

Inherits all the properties of React Native's Pressable component, created using @legendapp/motion's createMotionAnimatedComponent function to add animation.

### AlertDialogContent

Inherits all the properties of @legendapp/motion's Motion.View component.

### AlertDialogCloseButton

Inherits all the properties of React Native's Pressable component.

### AlertDialogHeader

Inherits all the properties of React Native's View component.

### AlertDialogBody

Inherits all the properties of React Native's View component.

### AlertDialogFooter

Inherits all the properties of React Native's View component.

## Default Styling

### AlertDialog

<!-- BASE_STYLE_START -->

The AlertDialog component uses the following base styling by default:

```css
/* Base styling applied to all AlertDialog components */
group/modal w-full h-full justify-center items-center web:pointer-events-none
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied based on the props passed to the AlertDialog component:

```json
{
  "size": {
    "xs": "",
    "sm": "",
    "md": "",
    "lg": "",
    "full": ""
  }
}
```

### AlertDialogBackdrop

<!-- BASE_STYLE_START -->

The AlertDialogBackdrop component uses the following base styling by default:

```css
/* Base styling applied to all AlertDialogBackdrop components */
absolute left-0 top-0 right-0 bottom-0 bg-background-dark web:cursor-default
```

<!-- BASE_STYLE_END -->

### AlertDialogContent

<!-- BASE_STYLE_START -->

The AlertDialogContent component uses the following base styling by default:

```css
/* Base styling applied to all AlertDialogContent components */
bg-background-0 rounded-lg overflow-hidden border border-outline-100 p-6
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to AlertDialogContent based on the props passed to the parent AlertDialog component:

```json
{
  "size": {
    "xs": "w-[60%] max-w-[360px]",
    "sm": "w-[70%] max-w-[420px]",
    "md": "w-[80%] max-w-[510px]",
    "lg": "w-[90%] max-w-[640px]",
    "full": "w-full"
  }
}
```

### AlertDialogCloseButton

<!-- BASE_STYLE_START -->

The AlertDialogCloseButton component uses the following base styling by default:

```css
/* Base styling applied to all AlertDialogCloseButton components */
group/alert-dialog-close-button z-10 rounded-sm p-2 data-[focus-visible=true]:bg-background-100 web:cursor-pointer outline-0
```

<!-- BASE_STYLE_END -->

### AlertDialogHeader

<!-- BASE_STYLE_START -->

The AlertDialogHeader component uses the following base styling by default:

```css
/* Base styling applied to all AlertDialogHeader components */
justify-between items-center flex-row
```

<!-- BASE_STYLE_END -->

### AlertDialogBody

<!-- BASE_STYLE_START -->

The AlertDialogBody component uses the following base styling by default:

```css
/* Base styling applied to all AlertDialogBody components */
```

<!-- BASE_STYLE_END -->

### AlertDialogFooter

<!-- BASE_STYLE_START -->

The AlertDialogFooter component uses the following base styling by default:

```css
/* Base styling applied to all AlertDialogFooter components */
flex-row justify-end items-center gap-3
```

<!-- BASE_STYLE_END -->

## Accessibility

- Follows WAI-ARIA Alert and Message Dialogs Pattern
- Supports keyboard navigation:
  - **Tab**: Moves focus to next tabbable element
  - **Shift+Tab**: Moves focus to previous tabbable element
  - **Escape**: Closes the dialog
- Screen reader support with appropriate ARIA attributes
- When dialog is open, `aria-modal="true"` is set on the content

## Examples

```jsx
import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  AlertDialogBackdrop,
} from "@/components/ui/alert-dialog";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Icon, TrashIcon } from "@/components/ui/icon";

function Example() {
  const [showAlertDialog, setShowAlertDialog] = React.useState(false);
  const handleClose = () => setShowAlertDialog(false);

  return (
    <>
      <Button onPress={() => setShowAlertDialog(true)}>
        <ButtonText>Delete Invoice</ButtonText>
      </Button>
      <AlertDialog isOpen={showAlertDialog} onClose={handleClose}>
        <AlertDialogBackdrop />
        <AlertDialogContent className="w-full max-w-[415px] gap-4 items-center">
          <Box className="rounded-full h-[52px] w-[52px] bg-background-error items-center justify-center">
            <Icon as={TrashIcon} size="lg" className="stroke-error-500" />
          </Box>
          <AlertDialogHeader className="mb-2">
            <Heading size="md">Delete account?</Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text size="sm" className="text-center">
              The invoice will be deleted from the invoices section and in the
              documents folder. This cannot be undone.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter className="mt-5">
            <Button
              size="sm"
              action="negative"
              onPress={handleClose}
              className="px-[30px]"
            >
              <ButtonText>Delete</ButtonText>
            </Button>
            <Button
              variant="outline"
              action="secondary"
              onPress={handleClose}
              size="sm"
              className="px-[30px]"
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```
