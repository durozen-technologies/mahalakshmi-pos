---
title: Skeleton
description: A loading state component for React & React Native that improves user experience during content loading.
---

# Skeleton

A loading state component for React & React Native that improves user experience during content loading.

```jsx
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

function Example() {
  return (
    <Box className="w-[325px] gap-4 p-3 rounded-md bg-background-100">
      <Skeleton variant="sharp" className="h-[150px]" />
      <SkeletonText _lines={3} className="h-3" />
      <HStack className="gap-2 align-middle">
        <Skeleton variant="circular" className="h-[24px] w-[24px] mr-2" />
        <SkeletonText _lines={2} gap={1} className="h-2 w-2/5" />
      </HStack>
    </Box>
  );
}
```

## Props

### Skeleton

variant: rounded | sharp | circular (default: rounded)
startColor: string (default: bg-background-200)
isLoaded: boolean (default: false)
speed: number (default: 2)

1: duration-75
2: duration-100
3: duration-150
4: duration-200

Renders a <div> on web and an <Animated.View> on native.

### SkeletonText

\_lines: number - Number of lines in text skeleton
startColor: string (default: bg-background-200)
isLoaded: boolean (default: false)
speed: number (default: 2)
gap: number (default: 2)

1: gap-1
2: gap-2
3: gap-3
4: gap-4

Renders a <div> on web and an Animated.View on native.

## Examples

```jsx
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Image } from "@/components/ui/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

function Example() {
  return (
    <Box className="w-[290px] h-[400px] p-4 rounded-sm bg-background-100 gap-3">
      <Skeleton
        variant="rounded"
        className="h-44 w-64 rounded-sm"
        isLoaded={false}
      >
        <Image
          className="h-44 w-64 rounded-sm"
          source={{
            uri: "https://images.unsplash.com/photo-1715006020121-dd50879f9821?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          }}
        />
      </Skeleton>
      <VStack className="gap-2">
        <Text className="text-primary-700 text-sm">May 15, 2023</Text>
        <Text className="text-primary-900 font-bold">
          The Power of Positive Thinking
        </Text>
        <Text className="text-primary-700 text-sm">
          Discover how the power of positive thinking can transform your life,
          boost your confidence, and help you overcome challenges.
        </Text>
      </VStack>
      <HStack className="gap-2">
        <Avatar size="xs">
          <AvatarFallbackText>John Smith</AvatarFallbackText>
        </Avatar>
        <Text className="text-sm font-bold">John Smith</Text>
      </HStack>
    </Box>
  );
}
```
