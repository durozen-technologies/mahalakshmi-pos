---
title: ScrollView
description: A scrollable container component for React & React Native applications.
---

# ScrollView

A scrollable container component for React & React Native applications. Inherits all React Native `ScrollView` component properties and className for styling.

```jsx
import { ScrollView } from "@/components/ui/scroll-view";
import { Text } from "@/components/ui/text";

function Example() {
  return (
    <ScrollView
      className="h-64 bg-background-50 p-4"
      contentContainerClassName="gap-4"
    >
      <Text>Scrollable content goes here</Text>
      <Text>More content to scroll</Text>
      <Text>Even more content</Text>
    </ScrollView>
  );
}
```

## Props

Renders as <div> with overflow styles on web and <ScrollView> on native.
Accepts all default React Native ScrollView props.
Accepts standard layout props and className for styling.

## Examples

```jsx
import { ScrollView } from "@/components/ui/scroll-view";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";

function ContentContainerExample() {
  return (
    <ScrollView
      className="h-64 bg-white rounded-lg"
      contentContainerClassName="p-4 gap-3"
    >
      {Array(10)
        .fill(0)
        .map((_, i) => (
          <Box key={i} className="p-4 bg-primary-100 rounded-md">
            <Text>Item {i + 1}</Text>
          </Box>
        ))}
    </ScrollView>
  );
}
```
