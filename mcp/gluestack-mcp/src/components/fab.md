---
title: Fab
description: A floating action button component for React & React Native with customizable properties.
---

# Fab

A floating action button component for React & React Native with customizable properties. Inherits all properties of React Native's Pressable component with className styling support.

```jsx
import { Box } from "@/components/ui/box";
import { Fab, FabLabel, FabIcon } from "@/components/ui/fab";
import { AddIcon } from "@/components/ui/icon";

function Example() {
  return (
    <Box className="h-[360px] w-80 bg-background-50 rounded-md">
      <Fab>
        <FabIcon as={AddIcon} />
        <FabLabel>Quick start</FabLabel>
      </Fab>
    </Box>
  );
}
```

## Props

### Fab

- **size**: `sm` | `md` | `lg` (default: `md`)
- **placement**: `top right` | `top left` | `bottom right` | `bottom left` | `top center` | `bottom center` (default: `bottom right`)
- **isHovered**: boolean (default: `false`)
- **isPressed**: boolean (default: `false`)
- **isFocused**: boolean (default: `false`)
- **isDisabled**: boolean (default: `false`)

### FabLabel

Contains all text related layout style props and actions.
Inherits all the properties of React Native's Text component.

### FabIcon

- **as**: Required prop to specify which icon to display
- **size**: `2xs` | `xs` | `sm` | `md` | `lg` | `xl`

Contains all Icon related layout style props and actions.
Inherits all the properties of gluestack Style's AsForwarder component.

## Default Styling

### Fab

<!-- BASE_STYLE_START -->

The Fab component uses the following base styling by default:

```css
/* Base styling applied to all Fab components */
bg-primary-500 rounded-full z-20 p-4 flex-row items-center justify-center absolute hover:bg-primary-600 active:bg-primary-700 disabled:opacity-40 disabled:pointer-events-all disabled:cursor-not-allowed data-[focus=true]:web:outline-none data-[focus-visible=true]:web:ring-2 data-[focus-visible=true]:web:ring-indicator-info shadow-hard-2
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "size": {
    "sm": "px-2.5 py-2.5",
    "md": "px-3 py-3",
    "lg": "px-4 py-4"
  },
  "placement": {
    "top right": "top-4 right-4",
    "top left": "top-4 left-4",
    "bottom right": "bottom-4 right-4",
    "bottom left": "bottom-4 left-4",
    "top center": "top-4 self-center",
    "bottom center": "bottom-4 self-center"
  }
}
```

<!-- VARIANT_STYLES_END -->

### FabLabel

<!-- BASE_STYLE_START -->

The FabLabel component uses the following base styling by default:

```css
/* Base styling applied to all FabLabel components */
text-typography-50 font-normal font-body tracking-md text-left mx-2
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
  },
  "sub": {
    "true": "text-xs"
  },
  "italic": {
    "true": "italic"
  },
  "highlight": {
    "true": "bg-yellow-500"
  }
}
```

### Parent-Based Styling

The styling below is applied to FabLabel based on the `size` prop passed to the parent Fab component:

```json
{
  "size": {
    "sm": "text-sm",
    "md": "text-base",
    "lg": "text-lg"
  }
}
```

<!-- VARIANT_STYLES_END -->

### FabIcon

<!-- BASE_STYLE_START -->

The FabIcon component uses the following base styling by default:

```css
/* Base styling applied to all FabIcon components */
text-typography-50 fill-none
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

## Features

- Keyboard support for actions
- Support for hover, focus and active states
- Option to add your styles or use the default styles

## Examples

```jsx
import { Box } from "@/components/ui/box";
import { Fab, FabIcon, FabLabel } from "@/components/ui/fab";
import { PlusIcon } from "@/components/ui/icon";

function Example() {
  return (
    <Box className="h-[200px] w-full bg-background-50 rounded-md relative">
      <Fab
        size="lg"
        placement="top right"
        className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800"
      >
        <FabIcon as={PlusIcon} />
        <FabLabel>New Message</FabLabel>
      </Fab>
    </Box>
  );
}
```
