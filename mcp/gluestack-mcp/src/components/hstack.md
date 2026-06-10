---
title: HStack
description: A layout component that arranges children horizontally with customizable spacing.
---

# HStack

A layout component that arranges children horizontally with customizable spacing. Renders as `<div>` on web and `<View>` on native and className for styling.

```jsx
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";

function Example() {
  return (
    <HStack space="md" reversed={false}>
      <Box className="h-20 w-20 bg-primary-300" />
      <Box className="h-20 w-20 bg-primary-400" />
      <Box className="h-20 w-20 bg-primary-500" />
    </HStack>
  );
}
```

## Props

- **space**: `xs` | `sm` | `md` | `lg` | `xl` | `2xl` | `3xl` | `4xl` - controls gap between children
- **reversed**: boolean (default: `false`) - reverses the order of children

## Default Styling

<!-- BASE_STYLE_START -->

The HStack component uses the following base styling by default:

```css
/* Base styling applied to all HStack components */
flex-row

/* Additional web-specific styling */
flex relative z-0 box-border border-0 list-none min-w-0 min-h-0 bg-transparent items-stretch m-0 p-0 text-decoration-none
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "space": {
    "xs": "gap-1",
    "sm": "gap-2",
    "md": "gap-3",
    "lg": "gap-4",
    "xl": "gap-5",
    "2xl": "gap-6",
    "3xl": "gap-7",
    "4xl": "gap-8"
  },
  "reversed": {
    "true": "flex-row-reverse"
  }
}
```

<!-- VARIANT_STYLES_END -->

## Examples

```jsx
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";

function Example() {
  return (
    <>
      <HStack space="lg" reversed={true} className="mt-4">
        <Box className="h-16 w-16 bg-success-300 rounded-md">
          <Text className="text-center">1</Text>
        </Box>
        <Box className="h-16 w-16 bg-success-400 rounded-md">
          <Text className="text-center">2</Text>
        </Box>
        <Box className="h-16 w-16 bg-success-500 rounded-md">
          <Text className="text-center">3</Text>
        </Box>
      </HStack>
    </>
  );
}
```
