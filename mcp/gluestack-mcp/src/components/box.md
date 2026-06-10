---
title: Box
description: Renders as `<div>` on web and `<View>` on native. Accepts standard layout props and className for styling.
---

# Box

Renders as `<div>` on web and `<View>` on native. Accepts standard layout props and className for styling.

```jsx
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";

function Example() {
  return (
    <>
      <Box className="bg-primary-500 p-5">
        <Text className="text-typography-0">This is the Box</Text>
      </Box>
      <Box className="bg-background-200 shadow-md border border-outline-300 rounded-lg p-5 m-2">
        <Text>Box with Shadow</Text>
      </Box>
    </>
  );
}
```

## Props

Renders as `<div>` on web and `<View>` on native. Accepts standard layout props and className for styling.

## Default Styling

<!-- BASE_STYLE_START -->

The Box component uses the following base styling by default:

```css
/* Base styling applied to all Box components, web-specific only */
flex flex-col relative z-0 box-border border-0 list-none min-w-0 min-h-0 bg-transparent items-stretch m-0 p-0 text-decoration-none
```

<!-- BASE_STYLE_END -->
