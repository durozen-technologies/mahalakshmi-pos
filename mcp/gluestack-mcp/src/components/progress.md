---
title: Progress
description: A visual indicator component for React & React Native that displays the progress of an operation.
---

# Progress

A visual indicator component for React & React Native that displays the progress of an operation. Inherits all properties of React Native's View component with className styling support.

```jsx
import { Center } from "@/components/ui/center";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";

function Example() {
  return (
    <Center className="w-[300px] h-[150px]">
      <Progress value={40}>
        <ProgressFilledTrack />
      </Progress>
    </Center>
  );
}
```

## Props

### Progress

- **size**: `xs` | `sm` | `md` | `lg` | `xl` | `2xl` (default: `md`)
- **orientation**: `horizontal` | `vertical` (default: `horizontal`)
- **value**: number - It is used to set the progress of the progress bar

### ProgressFilledTrack

Represents the filled portion of the progress bar.
Inherits all the properties of React Native's View component.

## Default Styling

### Progress

<!-- BASE_STYLE_START -->

The Progress component uses the following base styling by default:

```css
/* Base styling applied to all Progress components */
bg-background-300 rounded-full w-full
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "orientation": {
    "horizontal": "w-full",
    "vertical": "h-full"
  },
  "size": {
    "xs": "h-1",
    "sm": "h-2",
    "md": "h-3",
    "lg": "h-4",
    "xl": "h-5",
    "2xl": "h-6"
  }
}
```

### Compound Variants

These styles are applied when specific combinations of props are used:

```json
[
  {
    "orientation": "vertical",
    "size": "xs",
    "class": "h-full w-1 justify-end"
  },
  {
    "orientation": "vertical",
    "size": "sm",
    "class": "h-full w-2 justify-end"
  },
  {
    "orientation": "vertical",
    "size": "md",
    "class": "h-full w-3 justify-end"
  },
  {
    "orientation": "vertical",
    "size": "lg",
    "class": "h-full w-4 justify-end"
  },
  {
    "orientation": "vertical",
    "size": "xl",
    "class": "h-full w-5 justify-end"
  },
  {
    "orientation": "vertical",
    "size": "2xl",
    "class": "h-full w-6 justify-end"
  }
]
```

<!-- VARIANT_STYLES_END -->

### ProgressFilledTrack

<!-- BASE_STYLE_START -->

The ProgressFilledTrack component uses the following base styling by default:

```css
/* Base styling applied to all ProgressFilledTrack components */
bg-primary-500 rounded-full
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to ProgressFilledTrack based on the props passed to the parent Progress component:

```json
{
  "orientation": {
    "horizontal": "w-full",
    "vertical": "h-full"
  },
  "size": {
    "xs": "h-1",
    "sm": "h-2",
    "md": "h-3",
    "lg": "h-4",
    "xl": "h-5",
    "2xl": "h-6"
  }
}
```

### Parent Compound Variants

These styles are applied to ProgressFilledTrack when specific combinations of props are used on the parent Progress component:

```json
[
  {
    "orientation": "vertical",
    "size": "xs",
    "class": "h-full w-1"
  },
  {
    "orientation": "vertical",
    "size": "sm",
    "class": "h-full w-2"
  },
  {
    "orientation": "vertical",
    "size": "md",
    "class": "h-full w-3"
  },
  {
    "orientation": "vertical",
    "size": "lg",
    "class": "h-full w-4"
  },
  {
    "orientation": "vertical",
    "size": "xl",
    "class": "h-full w-5"
  },
  {
    "orientation": "vertical",
    "size": "2xl",
    "class": "h-full w-6"
  }
]
```

## Accessibility

- Keyboard navigation support with Tab key
- Screen reader compatibility that announces progress indicators
- ARIA attributes for better accessibility

## Examples

```jsx
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

function Example() {
  return (
    <VStack space="md" className="w-full">
      <Text size="md">Downloading 55%</Text>
      <Progress size="lg" value={55} className="w-full">
        <ProgressFilledTrack />
      </Progress>
    </VStack>
  );
}
```
