---
title: Center
description: Centers children horizontally and vertically. Renders as `<div>` on web and `<View>` on native and inherits all their properties.
---

# Center

Centers children horizontally and vertically. Renders as `<div>` on web and `<View>` on native and inherits all their properties and className for styling.

```jsx
import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";

function Example() {
  return (
    <Center className="bg-primary-500 h-[200px] w-[300px]">
      <Text className="text-typography-0 font-bold">This is the center.</Text>
    </Center>
  );
}
```

## Default Styling

<!-- BASE_STYLE_START -->

The Center component uses the following base styling by default:

```css
/* Base styling applied to all Center components */
justify-center items-center

/* Additional web-specific styling */
flex flex-col relative z-0
```

<!-- BASE_STYLE_END -->
