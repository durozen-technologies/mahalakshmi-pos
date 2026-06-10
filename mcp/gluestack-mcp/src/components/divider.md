---
title: Divider
description: A separator component for React & React Native that visually separates content in a layout.
---

# Divider

A separator component for React & React Native that visually separates content in a layout. Inherits all the properties of `View` React Native component and className for styling.

```jsx
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Text } from "@/components/ui/text";

function Example() {
  return (
    <Center>
      <Text className="font-semibold">Easy</Text>
      <Divider className="my-0.5" />
      <Text className="font-semibold">Difficult</Text>
    </Center>
  );
}
```

## Props

- **orientation**: `horizontal` | `vertical` (default: `horizontal`)

## Default Styling

<!-- BASE_STYLE_START -->

The Divider component uses the following base styling by default:

```css
/* Base styling applied to all Divider components */
bg-background-200
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "orientation": {
    "vertical": "w-px h-full",
    "horizontal": "h-px w-full"
  }
}
```

<!-- VARIANT_STYLES_END -->

## Examples

```jsx
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

function Example() {
  return (
    <VStack>
      <Heading>gluestack-ui</Heading>
      <Text>Universal component library</Text>
      <Divider className="my-2 bg-indigo-500" />
      <HStack className="">
        <Text>Installation</Text>
        <Divider
          orientation="vertical"
          className="mx-2 h-[20px] bg-emerald-500"
        />
        <Text>API Reference</Text>
        <Divider
          orientation="vertical"
          className="mx-2 h-[20px] bg-emerald-500"
        />
        <Text>Examples</Text>
      </HStack>
    </VStack>
  );
}
```
