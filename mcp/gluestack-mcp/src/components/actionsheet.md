---
title: Actionsheet
description: A bottom sheet component for Expo, React & React Native that displays a set of options.
---

# Actionsheet

Actionsheet is a bottom sheet component that slides up from the bottom of the screen to display a set of options with className styling support.

```jsx
import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetBackdrop,
} from "@/components/ui/actionsheet";
import { Button, ButtonText } from "@/components/ui/button";
import React from "react";

function Example() {
  const [showActionsheet, setShowActionsheet] = React.useState(false);
  const handleClose = () => setShowActionsheet(false);

  return (
    <>
      <Button onPress={() => setShowActionsheet(true)}>
        <ButtonText>Open Actionsheet</ButtonText>
      </Button>
      <Actionsheet isOpen={showActionsheet} onClose={handleClose}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionsheetItem onPress={handleClose}>
            <ActionsheetItemText>Edit Message</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={handleClose}>
            <ActionsheetItemText>Mark Unread</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={handleClose}>
            <ActionsheetItemText>Remind Me</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={handleClose}>
            <ActionsheetItemText>Add to Saved Items</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem isDisabled onPress={handleClose}>
            <ActionsheetItemText>Delete</ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
```

> **Important**: If snapPoints are not provided to Actionsheet, then it's essential to set maxHeight to ActionsheetContent.

## Props

### Actionsheet

- **isOpen**: boolean - If true, the Actionsheet will open
- **onClose**: () => any - Callback invoked when the Actionsheet is closed
- **onOpen**: () => any - Callback invoked when the Actionsheet is opened
- **useRNModal**: boolean (default: `false`) - If true, renders react-native native modal
- **defaultIsOpen**: boolean - Specifies the default open state of the Actionsheet
- **initialFocusRef**: React.RefObject<any> - The ref of element to receive focus when the Actionsheet opens
- **finalFocusRef**: React.RefObject<any> - The ref of element to receive focus when the Actionsheet closes
- **closeOnOverlayClick**: boolean - If true, the Actionsheet will close when the overlay is clicked
- **isKeyboardDismissable**: boolean - If true, the keyboard can dismiss the Actionsheet
- **trapFocus**: boolean (default: `true`) - If true, creates a focus scope containing all elements within the Actionsheet content
- **snapPoints**: Array<number> (default: `[50]`) - The snap points for the Actionsheet as percentages (0-100) of the screen height
- **preventScroll**: boolean (default: `true`) - If true, scroll will be prevented when the Actionsheet is open

Inherits all the properties of React Native's View component.

### ActionsheetBackdrop

Inherits all the properties of React Native's Pressable component, created using @legendapp/motion's createMotionAnimatedComponent function to add animation.

### ActionsheetContent

Inherits all the properties of @legendapp/motion's Motion.View component.

### ActionsheetDragIndicatorWrapper

Inherits all the properties of React Native's View component.

### ActionsheetDragIndicator

Inherits all the properties of React Native's View component.

### ActionsheetItem

Inherits all the properties of React Native's Pressable component.

### ActionsheetItemText

Inherits all the properties of React Native's Text component.

### ActionsheetIcon

Inherits all the properties of React Native's View component.

### Additional Components

- **ActionsheetScrollView**: Inherits all the properties of React Native's ScrollView component
- **ActionsheetVirtualizedList**: Inherits all the properties of React Native's VirtualizedList component
- **ActionsheetFlatList**: Inherits all the properties of React Native's FlatList component
- **ActionsheetSectionList**: Inherits all the properties of React Native's SectionList component
- **ActionsheetSectionHeaderText**: Inherits all the properties of React Native's Text component

> **Note**: While our Actionsheet component supports both ActionsheetScrollView and ActionsheetVirtualizedList, we recommend using VirtualizedList for better performance on large lists of items.

## Default Styling

### Actionsheet

<!-- BASE_STYLE_START -->

The Actionsheet component uses the following base styling by default:

```css
/* Base styling applied to all Actionsheet components */
w-full h-full web:pointer-events-none
```

<!-- BASE_STYLE_END -->

### ActionsheetBackdrop

<!-- BASE_STYLE_START -->

The ActionsheetBackdrop component uses the following base styling by default:

```css
/* Base styling applied to all ActionsheetBackdrop components */
absolute left-0 top-0 right-0 bottom-0 bg-background-dark web:cursor-default web:pointer-events-auto
```

<!-- BASE_STYLE_END -->

### ActionsheetContent

<!-- BASE_STYLE_START -->

The ActionsheetContent component uses the following base styling by default:

```css
/* Base styling applied to all ActionsheetContent components */
items-center rounded-tl-3xl rounded-tr-3xl p-5 pt-2 bg-background-0 web:pointer-events-auto web:select-none shadow-hard-5 border border-b-0 border-outline-100
```

<!-- BASE_STYLE_END -->

### ActionsheetDragIndicatorWrapper

<!-- BASE_STYLE_START -->

The ActionsheetDragIndicatorWrapper component uses the following base styling by default:

```css
/* Base styling applied to all ActionsheetDragIndicatorWrapper components */
w-full py-1 items-center
```

<!-- BASE_STYLE_END -->

### ActionsheetDragIndicator

<!-- BASE_STYLE_START -->

The ActionsheetDragIndicator component uses the following base styling by default:

```css
/* Base styling applied to all ActionsheetDragIndicator components */
w-16 h-1 bg-background-400 rounded-full
```

<!-- BASE_STYLE_END -->

### ActionsheetItem

<!-- BASE_STYLE_START -->

The ActionsheetItem component uses the following base styling by default:

```css
/* Base styling applied to all ActionsheetItem components */
w-full flex-row items-center p-3 rounded-sm data-[disabled=true]:opacity-40 data-[disabled=true]:web:pointer-events-auto data-[disabled=true]:web:cursor-not-allowed hover:bg-background-50 active:bg-background-100 data-[focus=true]:bg-background-100 web:data-[focus-visible=true]:bg-background-100 web:data-[focus-visible=true]:outline-indicator-primary gap-2
```

<!-- BASE_STYLE_END -->

### ActionsheetItemText

<!-- BASE_STYLE_START -->

The ActionsheetItemText component uses the following base styling by default:

```css
/* Base styling applied to all ActionsheetItemText components */
text-typography-700 font-normal font-body
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "isTruncated": {
    "true": ""
  },
  "bold": {
    "true": "font-bold"
  },
  "underline": {
    "true": "underline"
  },
  "strikeThrough": {
    "true": "line-through"
  },
  "size": {
    "2xs": "text-2xs",
    "xs": "text-xs",
    "sm": "text-sm",
    "md": "text-base",
    "lg": "text-lg",
    "xl": "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl"
  }
}
```

<!-- VARIANT_STYLES_END -->

### ActionsheetIcon

<!-- BASE_STYLE_START -->

The ActionsheetIcon component uses the following base styling by default:

```css
/* Base styling applied to all ActionsheetIcon components */
text-background-500 fill-none
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "size": {
    "2xs": "h-3 w-3",
    "xs": "h-3.5 w-3.5",
    "sm": "h-4 w-4",
    "md": "w-[18px] h-[18px]",
    "lg": "h-5 w-5",
    "xl": "h-6 w-6"
  }
}
```

<!-- VARIANT_STYLES_END -->

### ActionsheetScrollView

<!-- BASE_STYLE_START -->

The ActionsheetScrollView component uses the following base styling by default:

```css
/* Base styling applied to all ActionsheetScrollView components */
w-full h-auto
```

<!-- BASE_STYLE_END -->

### ActionsheetVirtualizedList

<!-- BASE_STYLE_START -->

The ActionsheetVirtualizedList component uses the following base styling by default:

```css
/* Base styling applied to all ActionsheetVirtualizedList components */
w-full h-auto
```

<!-- BASE_STYLE_END -->

### ActionsheetFlatList

<!-- BASE_STYLE_START -->

The ActionsheetFlatList component uses the following base styling by default:

```css
/* Base styling applied to all ActionsheetFlatList components */
w-full h-auto
```

<!-- BASE_STYLE_END -->

### ActionsheetSectionList

<!-- BASE_STYLE_START -->

The ActionsheetSectionList component uses the following base styling by default:

```css
/* Base styling applied to all ActionsheetSectionList components */
w-full h-auto
```

<!-- BASE_STYLE_END -->

### ActionsheetSectionHeaderText

<!-- BASE_STYLE_START -->

The ActionsheetSectionHeaderText component uses the following base styling by default:

```css
/* Base styling applied to all ActionsheetSectionHeaderText components */
leading-5 font-bold font-heading my-0 text-typography-500 p-3 uppercase
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "isTruncated": {
    "true": ""
  },
  "bold": {
    "true": "font-bold"
  },
  "underline": {
    "true": "underline"
  },
  "strikeThrough": {
    "true": "line-through"
  },
  "size": {
    "5xl": "text-5xl",
    "4xl": "text-4xl",
    "3xl": "text-3xl",
    "2xl": "text-2xl",
    "xl": "text-xl",
    "lg": "text-lg",
    "md": "text-base",
    "sm": "text-sm",
    "xs": "text-xs"
  },
  "sub": {
    "true": "text-xs"
  },
  "italic": {
    "true": "italic"
  },
  "highlight": {
    "true": "bg-yellow500"
  }
}
```

### Default Variants

```json
{
  "size": "xs"
}
```

<!-- VARIANT_STYLES_END -->

## Accessibility

- Actionsheet has aria-modal set to true
- Actionsheet has role set to dialog
- Focus is trapped within the Actionsheet when it opens
- Keyboard support:
  - **Space**: Opens the actionsheet
  - **Enter**: Opens/closes the actionsheet
  - **Tab/Shift+Tab**: Moves focus between focusable elements
  - **Esc**: Closes the actionsheet
- Screen reader support announces button name and Actionsheet content

## Examples

```jsx
import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetBackdrop,
  ActionsheetIcon,
} from "@/components/ui/actionsheet";
import { Button, ButtonText } from "@/components/ui/button";
import {
  ClockIcon,
  DownloadIcon,
  EditIcon,
  EyeOffIcon,
  TrashIcon,
} from "@/components/ui/icon";
import React from "react";

function Example() {
  const [showActionsheet, setShowActionsheet] = React.useState(false);
  const handleClose = () => setShowActionsheet(false);

  return (
    <>
      <Button onPress={() => setShowActionsheet(true)}>
        <ButtonText>Open</ButtonText>
      </Button>
      <Actionsheet isOpen={showActionsheet} onClose={handleClose}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <ActionsheetItem onPress={handleClose}>
            <ActionsheetIcon className="stroke-background-700" as={EditIcon} />
            <ActionsheetItemText>Edit Message</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={handleClose}>
            <ActionsheetIcon
              className="stroke-background-700"
              as={EyeOffIcon}
            />
            <ActionsheetItemText>Mark Unread</ActionsheetItemText>
          </ActionsheetItem>
          {/* Additional items */}
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
```
