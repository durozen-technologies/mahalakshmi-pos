---
title: Image
description: Image component with React Native properties and className styling.
---

# Image

A customizable image component for React & React Native that inherits all React Native `Image` properties with className styling support.

```jsx
import { Image } from "@/components/ui/image";

function Example() {
  return (
    <Image
      size="md"
      source={{
        uri: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      }}
      alt="image"
    />
  );
}
```

## Props

- **size**: `2xs` | `xs` | `sm` | `md` | `lg` | `xl` | `2xl` | `full` | `none` (default: `md`)

Inherits all the properties of React Native's Image component.

## Default Styling

<!-- BASE_STYLE_START -->

The Image component uses the following base styling by default:

```css
/* Base styling applied to all Image components */
max-w-full
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "size": {
    "2xs": "h-6 w-6",
    "xs": "h-10 w-10",
    "sm": "h-16 w-16",
    "md": "h-20 w-20",
    "lg": "h-24 w-24",
    "xl": "h-32 w-32",
    "2xl": "h-64 w-64",
    "full": "h-full w-full",
    "none": ""
  }
}
```

<!-- VARIANT_STYLES_END -->

## Platform-Specific Styling

On the web platform, the Image component applies additional styling:

```jsx
style={
  Platform.OS === 'web'
    ? { height: 'revert-layer', width: 'revert-layer' }
    : undefined
}
```

## Examples

```jsx
import { Image } from "@/components/ui/image";
import { VStack } from "@/components/ui/vstack";

function Example() {
  return (
    <VStack space="md" className="items-center">
      <Image
        source={{
          uri: "https://gluestack.github.io/public-blog-video-assets/mountains.png",
        }}
        alt="Logo"
        size="none"
        className="aspect-[320/208] w-full max-w-[320px] rounded-lg"
      />

      <Image
        source={require("./assets/images/example.png")}
        alt="Small"
        size="xs"
        className="rounded-full"
      />
    </VStack>
  );
}
```
