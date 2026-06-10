---
title: Pressable
description: Touchable component with interaction states and React Native properties.
---

# Pressable

A touchable component for React & React Native that responds to various interaction states. Inherits all React Native `Pressable` component properties and accepts only className for styling.

```jsx
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";

function Example() {
  return (
    <Pressable
      onPress={() => console.log("Hello")}
      className="p-5 bg-primary-500"
    >
      <Text className="text-typography-0">Press me</Text>
    </Pressable>
  );
}
```

## Default Styling

<!-- BASE_STYLE_START -->

The Pressable component uses the following base styling by default:

```css
/* Base styling applied to all Pressable components */
data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-indicator-info data-[focus-visible=true]:ring-2 data-[disabled=true]:opacity-40
```

<!-- BASE_STYLE_END -->
