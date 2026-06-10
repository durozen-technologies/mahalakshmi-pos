---
title: Avatar
description: Avatar component with support for images, text fallbacks, and status indicators.
---

# Avatar

A versatile avatar component for React & React Native with customizable properties. Inherits all properties of React Native View component with className styling support.

```jsx
import {
  Avatar,
  AvatarBadge,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";

function Example() {
  return (
    <Avatar>
      <AvatarFallbackText>Jane Doe</AvatarFallbackText>
      <AvatarImage
        source={{
          uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
        }}
      />
      <AvatarBadge />
    </Avatar>
  );
}
```

## Props

### Avatar

- **size**: `xs` | `sm` | `md` | `lg` | `xl` | `2xl` (default: `md`)

### AvatarGroup

Container for multiple avatars with flex row reverse layout.
Inherits all the properties of React Native's View component.

### AvatarImage

Used for displaying the avatar image.
Inherits all the properties of React Native's Image component.

### AvatarFallbackText

Displays text when the image is not available or fails to load.
Inherits all the properties of React Native's Text component.

### AvatarBadge

Used to show status indicators (online, offline, etc.).
Inherits all the properties of React Native's View component.

> **Important Note:**  
> For iOS: It is highly recommended to use `<AvatarFallbackText />` before `<AvatarImage />` to avoid indexing issues in iOS.

## Default Styling

### Avatar

<!-- BASE_STYLE_START -->

The Avatar component uses the following base styling by default:

```css
/* Base styling applied to all Avatar components */
rounded-full justify-center items-center relative bg-primary-600 group-[.avatar-group]/avatar-group:-ml-2.5
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "size": {
    "xs": "w-6 h-6",
    "sm": "w-8 h-8",
    "md": "w-12 h-12",
    "lg": "w-16 h-16",
    "xl": "w-24 h-24",
    "2xl": "w-32 h-32"
  }
}
```

<!-- VARIANT_STYLES_END -->

### AvatarFallbackText

<!-- BASE_STYLE_START -->

The AvatarFallbackText component uses the following base styling by default:

```css
/* Base styling applied to all AvatarFallbackText components */
text-typography-0 font-semibold overflow-hidden text-transform:uppercase web:cursor-default
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to AvatarFallbackText based on the `size` prop passed to the parent Avatar component:

```json
{
  "size": {
    "xs": "text-2xs",
    "sm": "text-xs",
    "md": "text-base",
    "lg": "text-xl",
    "xl": "text-3xl",
    "2xl": "text-5xl"
  }
}
```

### AvatarGroup

<!-- BASE_STYLE_START -->

The AvatarGroup component uses the following base styling by default:

```css
/* Base styling applied to all AvatarGroup components */
group/avatar-group flex-row-reverse relative avatar-group
```

<!-- BASE_STYLE_END -->

### AvatarBadge

<!-- BASE_STYLE_START -->

The AvatarBadge component uses the following base styling by default:

```css
/* Base styling applied to all AvatarBadge components */
w-5 h-5 bg-success-500 rounded-full absolute right-0 bottom-0 border-background-0 border-2
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to AvatarBadge based on the `size` prop passed to the parent Avatar component:

```json
{
  "size": {
    "xs": "w-2 h-2",
    "sm": "w-2 h-2",
    "md": "w-3 h-3",
    "lg": "w-4 h-4",
    "xl": "w-6 h-6",
    "2xl": "w-8 h-8"
  }
}
```

### AvatarImage

<!-- BASE_STYLE_START -->

The AvatarImage component uses the following base styling by default:

```css
/* Base styling applied to all AvatarImage components */
h-full w-full rounded-full absolute z-10
```

<!-- BASE_STYLE_END -->

## Examples

```jsx
import {
  Avatar,
  AvatarBadge,
  AvatarFallbackText,
  AvatarImage,
  AvatarGroup,
} from "@/components/ui/avatar";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { User } from "lucide-react-native";

function Example() {
  return (
    <VStack space="xl">
      {/* Avatar group example */}
      <VStack space="sm">
        <Text className="font-semibold">Team Members</Text>
        <AvatarGroup>
          <Avatar size="md">
            <AvatarFallbackText>John Doe</AvatarFallbackText>
            <AvatarImage
              source={{
                uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
              }}
            />
            <AvatarBadge />
          </Avatar>
          <Avatar size="md">
            <AvatarFallbackText>John Doe</AvatarFallbackText>
            <AvatarImage
              source={{
                uri: "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
              }}
            />
            <AvatarBadge />
          </Avatar>
          <Avatar size="md">
            <AvatarFallbackText>John Doe</AvatarFallbackText>
            <AvatarImage
              source={{
                uri: "https://images.unsplash.com/photo-1614289371518-722f2615943d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
              }}
            />
            <AvatarBadge />
          </Avatar>
        </AvatarGroup>
      </VStack>

      {/* Avatars with icon and profile info */}
      <VStack space="2xl">
        <HStack space="md">
          <Avatar
            size="lg"
            className="bg-indigo-300 border-2 border-indigo-600"
          >
            <Icon as={User} size="xl" className="text-indigo-600" />
          </Avatar>
          <VStack>
            <Heading size="sm">Ronald Richards</Heading>
            <Text size="sm">Nursing Assistant</Text>
          </VStack>
        </HStack>
        <HStack space="md">
          <Avatar size="lg" className="bg-pink-300 border-2 border-pink-600">
            <Icon as={User} size="xl" className="text-pink-600" />
          </Avatar>
          <VStack>
            <Heading size="sm">Kevin James</Heading>
            <Text size="sm">Web Designer</Text>
          </VStack>
        </HStack>
      </VStack>
    </VStack>
  );
}
```
