---
title: Popover
description: A contextual overlay component for React & React Native that displays information, controls, or forms.
---

# Popover

Popover is a contextual overlay component for React & React Native that displays information, controls, or forms with className styling support.

```jsx
import { Button, ButtonText } from "@/components/ui/button";
import {
  Popover,
  PopoverBackdrop,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
} from "@/components/ui/popover";
import { Text } from "@/components/ui/text";
import React from "react";

function Example() {
  const [isOpen, setIsOpen] = React.useState(false);
  const handleOpen = () => {
    setIsOpen(true);
  };
  const handleClose = () => {
    setIsOpen(false);
  };
  return (
    <Popover
      isOpen={isOpen}
      onClose={handleClose}
      onOpen={handleOpen}
      placement="bottom"
      size="md"
      trigger={(triggerProps) => {
        return (
          <Button {...triggerProps}>
            <ButtonText>Open Popover</ButtonText>
          </Button>
        );
      }}
    >
      <PopoverBackdrop />
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>
          <Text className="text-typography-900">
            Alex, Annie and many others are already enjoying the Pro features,
            don't miss out on the fun!
          </Text>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
```

## Props

### Popover

- **size**: `xs` | `sm` | `md` | `lg` | `full` (default: `md`)
- **placement**: `top` | `top left` | `top right` | `bottom` | `bottom left` | `bottom right` | `right` | `right top` | `right bottom` | `left` | `left top` | `left bottom` (default: `bottom`)
- **defaultIsOpen**: boolean - Specifies the default open state of the popover
- **isOpen**: boolean - If true, the popover will open (controlled state)
- **trapFocus**: boolean (default: `true`) - Whether popover should trap focus
- **focusScope**: boolean (default: `true`) - Whether focus should be outside of popover or not
- **shouldFlip**: boolean (default: `true`) - Whether the element should flip its orientation when there is insufficient room
- **initialFocusRef**: React.RefObject<any> - The ref of element to receive focus when the popover opens
- **finalFocusRef**: React.RefObject<any> - The ref of element to receive focus when the popover closes
- **trigger**: () => any - Function that returns a React Element as the trigger
- **crossOffset**: number - The additional offset applied along the cross axis
- **offset**: number - The additional offset applied along the main axis
- **shouldOverlapWithTrigger**: boolean (default: `false`) - Determines whether popover content should overlap with the trigger
- **isKeyboardDismissable**: boolean - If true, the keyboard can dismiss the popover
- **useRNModal**: boolean (default: `false`) - If true, renders react-native native modal
- **avoidKeyboard**: boolean - If true, the popover will avoid the keyboard
- **onOpen**: () => any - Function invoked when popover is opened
- **onClose**: () => any - Function invoked when popover is closed

Inherits all the properties of React Native's View component.

### PopoverBackdrop

Inherits all the properties of React Native's Pressable component, created using @legendapp/motion's createMotionAnimatedComponent function to add animation.

### PopoverContent

Inherits all the properties of @legendapp/motion's Motion.View component.

### PopoverArrow

Inherits all the properties of @legendapp/motion's Motion.View component.

### PopoverHeader

Inherits all the properties of React Native's View component.

### PopoverBody

Inherits all the properties of React Native's View component.

### PopoverFooter

Inherits all the properties of React Native's View component.

### PopoverCloseButton

Inherits all the properties of React Native's Pressable component.

## Default Styling

### Popover

<!-- BASE_STYLE_START -->

The Popover component uses the following base styling by default:

```css
/* Base styling applied to all Popover components */
group/popover w-full h-full justify-center items-center web:pointer-events-none
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

### PopoverBackdrop

<!-- BASE_STYLE_START -->

The PopoverBackdrop component uses the following base styling by default:

```css
/* Base styling applied to all PopoverBackdrop components */
absolute left-0 top-0 right-0 bottom-0 web:cursor-default
```

<!-- BASE_STYLE_END -->

### PopoverContent

<!-- BASE_STYLE_START -->

The PopoverContent component uses the following base styling by default:

```css
/* Base styling applied to all PopoverContent components */
bg-background-0 rounded-lg overflow-hidden border border-outline-100 w-full
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to PopoverContent based on the props passed to the parent Popover component:

```json
{
  "size": {
    "xs": "max-w-[360px] p-3.5",
    "sm": "max-w-[420px] p-4",
    "md": "max-w-[510px] p-[18px]",
    "lg": "max-w-[640px] p-5",
    "full": "p-6"
  }
}
```

### PopoverArrow

<!-- BASE_STYLE_START -->

The PopoverArrow component uses the following base styling by default:

```css
/* Base styling applied to all PopoverArrow components */
bg-background-0 z-[1] border absolute overflow-hidden h-3.5 w-3.5 border-outline-100
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "placement": {
    "top left": "data-[flip=false]:border-t-0 data-[flip=false]:border-l-0 data-[flip=true]:border-b-0 data-[flip=true]:border-r-0",
    "top": "data-[flip=false]:border-t-0 data-[flip=false]:border-l-0 data-[flip=true]:border-b-0 data-[flip=true]:border-r-0",
    "top right": "data-[flip=false]:border-t-0 data-[flip=false]:border-l-0 data-[flip=true]:border-b-0 data-[flip=true]:border-r-0",
    "bottom": "data-[flip=false]:border-b-0 data-[flip=false]:border-r-0 data-[flip=true]:border-t-0 data-[flip=true]:border-l-0",
    "bottom left": "data-[flip=false]:border-b-0 data-[flip=false]:border-r-0 data-[flip=true]:border-t-0 data-[flip=true]:border-l-0",
    "bottom right": "data-[flip=false]:border-b-0 data-[flip=false]:border-r-0 data-[flip=true]:border-t-0 data-[flip=true]:border-l-0",
    "left": "data-[flip=false]:border-l-0 data-[flip=false]:border-b-0 data-[flip=true]:border-r-0 data-[flip=true]:border-t-0",
    "left top": "data-[flip=false]:border-l-0 data-[flip=false]:border-b-0 data-[flip=true]:border-r-0 data-[flip=true]:border-t-0",
    "left bottom": "data-[flip=false]:border-l-0 data-[flip=false]:border-b-0 data-[flip=true]:border-r-0 data-[flip=true]:border-t-0",
    "right": "data-[flip=false]:border-r-0 data-[flip=false]:border-t-0 data-[flip=true]:border-l-0 data-[flip=true]:border-b-0",
    "right top": "data-[flip=false]:border-r-0 data-[flip=false]:border-t-0 data-[flip=true]:border-l-0 data-[flip=true]:border-b-0",
    "right bottom": "data-[flip=false]:border-r-0 data-[flip=false]:border-t-0 data-[flip=true]:border-l-0 data-[flip=true]:border-b-0"
  }
}
```

<!-- VARIANT_STYLES_END -->

### PopoverCloseButton

<!-- BASE_STYLE_START -->

The PopoverCloseButton component uses the following base styling by default:

```css
/* Base styling applied to all PopoverCloseButton components */
group/popover-close-button z-[1] rounded-sm data-[focus-visible=true]:web:bg-background-100 web:outline-0 web:cursor-pointer
```

<!-- BASE_STYLE_END -->

### PopoverHeader

<!-- BASE_STYLE_START -->

The PopoverHeader component uses the following base styling by default:

```css
/* Base styling applied to all PopoverHeader components */
flex-row justify-between items-center
```

<!-- BASE_STYLE_END -->

### PopoverBody

<!-- BASE_STYLE_START -->

The PopoverBody component uses the following base styling by default:

```css
/* Base styling applied to all PopoverBody components */
```

<!-- BASE_STYLE_END -->

### PopoverFooter

<!-- BASE_STYLE_START -->

The PopoverFooter component uses the following base styling by default:

```css
/* Base styling applied to all PopoverFooter components */
flex-row justify-between items-center
```

<!-- BASE_STYLE_END -->

## Accessibility

- Adheres to the Dialog WAI-ARIA design pattern
- Keyboard support:
  - **Space/Enter**: Opens/closes the popover
  - **Tab**: Moves focus to the next focusable element
  - **Shift + Tab**: Moves focus to the previous focusable element
  - **Esc**: Closes the popover and moves focus to PopoverTrigger
- Screen Reader: Announces "Popover, menu expanded, button" when opened and "Popover, menu collapsed, button" when closed

## Examples

```jsx
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
  AvatarGroup,
} from "@/components/ui/avatar";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Popover,
  PopoverBackdrop,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
} from "@/components/ui/popover";
import { Text } from "@/components/ui/text";
import React from "react";

function Example() {
  const [isOpen, setIsOpen] = React.useState(false);
  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <Popover
      isOpen={isOpen}
      onClose={handleClose}
      onOpen={handleOpen}
      trigger={(triggerProps) => {
        return (
          <Button {...triggerProps} size="sm">
            <ButtonText>Open Popover</ButtonText>
          </Button>
        );
      }}
    >
      <PopoverBackdrop />
      <PopoverContent className="w-full max-w-[420px] p-4">
        <PopoverArrow />
        <PopoverBody contentContainerClassName="flex flex-row gap-4">
          <AvatarGroup className="flex-row items-center">
            <Avatar className="w-9 h-9 border-[1.5px] border-outline-0">
              <AvatarFallbackText>John Doe</AvatarFallbackText>
              <AvatarImage
                source={{
                  uri: "https://i.ibb.co/PF4vFQk/a130347c432c7b83615044cec215d824.jpg",
                }}
                alt="imageAltText"
              />
            </Avatar>
            {/* Additional avatars */}
          </AvatarGroup>
          <Text className="text-typography-900" size="sm">
            Alex, Annie and many others are already enjoying the Pro features,
            don't miss out on the fun!
          </Text>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
```
