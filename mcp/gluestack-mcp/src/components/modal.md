---
title: Modal
description: A responsive overlay component for alerts, forms, and notifications.
---

# Modal

Modal is a responsive overlay component that creates focused interactions for alerts, forms, and notifications with className styling support.

```jsx
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { Icon, CloseIcon } from "@/components/ui/icon";
import React from "react";

function Example() {
  const [showModal, setShowModal] = React.useState(false);
  return (
    <Center className="h-[300px]">
      <Button onPress={() => setShowModal(true)}>
        <ButtonText>Show Modal</ButtonText>
      </Button>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="md" className="text-typography-950">
              Invite your team
            </Heading>
            <ModalCloseButton>
              <Icon
                as={CloseIcon}
                size="md"
                className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900"
              />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <Text size="sm" className="text-typography-500">
              Elevate user interactions with our versatile modals. Seamlessly
              integrate notifications, forms, and media displays. Make an impact
              effortlessly.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              action="secondary"
              onPress={() => setShowModal(false)}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button onPress={() => setShowModal(false)}>
              <ButtonText>Explore</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Center>
  );
}
```

## Props

### Modal

- **size**: `xs` | `sm` | `md` | `lg` | `full` (default: `md`)
- **isOpen**: boolean - If true, the modal will open
- **onClose**: () => any - Callback invoked when the modal is closed
- **useRNModal**: boolean (default: `false`) - If true, renders react-native native modal
- **defaultIsOpen**: boolean - Specifies the default open state of the Modal
- **initialFocusRef**: React.RefObject<any> - The ref of element to receive focus when the modal opens
- **finalFocusRef**: React.RefObject<any> - The ref of element to receive focus when the modal closes
- **avoidKeyboard**: boolean - If true, the Modal will avoid the keyboard
- **closeOnOverlayClick**: boolean - If true, the Modal will close when the overlay is clicked
- **isKeyboardDismissable**: boolean - If true, the keyboard can dismiss the Modal
- **children**: any - The content to display inside the Modal

Inherits all the properties of React Native's View component.

### ModalBackdrop

Inherits all the properties of React Native's Pressable component, created using @legendapp/motion's createMotionAnimatedComponent function to add animation.

### ModalContent

- **focusable**: boolean (default: `false`) - If true, Modal Content will be focusable

Inherits all the properties of @legendapp/motion's Motion.View component.

### ModalHeader

Inherits all the properties of React Native's View component.

### ModalCloseButton

Inherits all the properties of React Native's View component.

### ModalBody

Inherits all the properties of React Native's View component.

### ModalFooter

Inherits all the properties of React Native's View component.

## Default Styling

### Modal

<!-- BASE_STYLE_START -->

The Modal component uses the following base styling by default:

```css
/* Base styling applied to all Modal components */
group/modal w-full h-full justify-center items-center web:pointer-events-none
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

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

<!-- VARIANT_STYLES_END -->

### ModalBackdrop

<!-- BASE_STYLE_START -->

The ModalBackdrop component uses the following base styling by default:

```css
/* Base styling applied to all ModalBackdrop components */
absolute left-0 top-0 right-0 bottom-0 bg-background-dark web:cursor-default
```

<!-- BASE_STYLE_END -->

### ModalContent

<!-- BASE_STYLE_START -->

The ModalContent component uses the following base styling by default:

```css
/* Base styling applied to all ModalContent components */
bg-background-0 rounded-md overflow-hidden border border-outline-100 shadow-hard-2 p-6
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to ModalContent based on the props passed to the parent Modal component:

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

### ModalCloseButton

<!-- BASE_STYLE_START -->

The ModalCloseButton component uses the following base styling by default:

```css
/* Base styling applied to all ModalCloseButton components */
group/modal-close-button z-10 rounded data-[focus-visible=true]:web:bg-background-100 web:outline-0 cursor-pointer
```

<!-- BASE_STYLE_END -->

### ModalHeader

<!-- BASE_STYLE_START -->

The ModalHeader component uses the following base styling by default:

```css
/* Base styling applied to all ModalHeader components */
justify-between items-center flex-row
```

<!-- BASE_STYLE_END -->

### ModalBody

<!-- BASE_STYLE_START -->

The ModalBody component uses the following base styling by default:

```css
/* Base styling applied to all ModalBody components */
mt-2 mb-6
```

<!-- BASE_STYLE_END -->

### ModalFooter

<!-- BASE_STYLE_START -->

The ModalFooter component uses the following base styling by default:

```css
/* Base styling applied to all ModalFooter components */
flex-row justify-end items-center gap-2
```

<!-- BASE_STYLE_END -->

## Accessibility

- Follows the Dialog Modal WAI-ARIA design pattern
- Uses React Native ARIA @react-native-aria/focus for accessibility support
- When modal opens, focus is automatically trapped inside the modal
- Supports keyboard navigation and screen reader announcements

## Examples

```jsx
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import React from "react";

function Example() {
  const [showModal, setShowModal] = React.useState(false);

  return (
    <>
      <Button onPress={() => setShowModal(true)}>
        <ButtonText>Dashboard</ButtonText>
      </Button>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalBackdrop />
        <ModalContent className="max-w-[375px]">
          <Image
            source={{
              uri: "https://gluestack.github.io/public-blog-video-assets/Image%20Element.png",
            }}
            alt="image"
            className="h-[185px] w-full rounded"
          />
          <ModalBody className="mb-5" contentContainerClassName="">
            <Heading size="md" className="text-typography-950 text-center">
              Welcome to the dashboard
            </Heading>
            <Text size="sm" className="text-typography-500 text-center">
              We are glad to have you on board, Here are some quick tips to let
              you up and running.
            </Text>
          </ModalBody>
          <ModalFooter className="w-full">
            <Button
              variant="outline"
              action="secondary"
              size="sm"
              onPress={() => setShowModal(false)}
              className="flex-grow"
            >
              <ButtonText>Skip</ButtonText>
            </Button>
            <Button
              onPress={() => setShowModal(false)}
              size="sm"
              className="flex-grow"
            >
              <ButtonText>Next</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
```
