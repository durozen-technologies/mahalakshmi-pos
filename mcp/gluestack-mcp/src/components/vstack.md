---
title: VStack
description: A layout component that arranges children vertically with customizable spacing.
---

# VStack

A layout component that arranges children vertically with customizable spacing. Inherits all properties of `<div>` on web and `<View>` on native with className styling support.

```jsx
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";

function Example() {
  return (
    <VStack space="lg" reversed={false}>
      <Box className="h-20 w-20 bg-primary-300" />
      <Box className="h-20 w-20 bg-primary-400" />
      <Box className="h-20 w-20 bg-primary-500" />
    </VStack>
  );
}
```

## Props

- **space**: `xs` | `sm` | `md` | `lg` | `xl` | `2xl` | `3xl` | `4xl` - controls gap between children
- **reversed**: boolean (default: `false`) - reverses the order of children

## Default Styling

<!-- BASE_STYLE_START -->

The VStack component uses the following base styling by default:

```css
/* Base styling applied to all VStack components */
flex-col

/* Additional web-specific styling */
flex flex-col relative z-0 box-border border-0 list-none min-w-0 min-h-0 bg-transparent items-stretch m-0 p-0 text-decoration-none
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
    "true": "flex-col-reverse"
  }
}
```

<!-- VARIANT_STYLES_END -->
