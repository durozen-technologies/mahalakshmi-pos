---
title: Badge
description: Status indicator component that highlights information with React Native properties.
---

# Badge

A status indicator component for React & React Native that highlights information or status. Inherits all properties of React Native's View component with className styling support.

```jsx
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { GlobeIcon } from "@/components/ui/icon";

function Example() {
  return (
    <Badge>
      <BadgeText>Verified</BadgeText>
      <BadgeIcon as={GlobeIcon} className="ml-2" />
    </Badge>
  );
}
```

## Props

### Badge

- **action**: `error` | `warning` | `success` | `info` | `muted` (default: `muted`)
- **variant**: `solid` | `outline` (default: `solid`)
- **size**: `sm` | `md` | `lg` (default: `md`)

### BadgeText

- **isTruncated**: boolean (default: `false`) - When true, text will be truncated if it exceeds its container
- **bold**: boolean (default: `false`) - When true, text will be bold
- **underline**: boolean (default: `false`) - When true, text will be underlined
- **strikeThrough**: boolean (default: `false`) - When true, text will have a line through it
- **italic**: boolean (default: `false`) - When true, text will be italicized
- **highlight**: boolean (default: `false`) - When true, text will have a yellow background highlight
- **sub**: boolean (default: `false`) - Sets text size to xs

Inherits all the properties of React Native's Text component.

### BadgeIcon

- **as**: Required prop to specify which icon to display

Contains all Icon related layout style props and actions.

## Default Styling

### Badge

<!-- BASE_STYLE_START -->

The Badge component uses the following base styling by default:

```css
/* Base styling applied to all Badge components */
flex-row items-center rounded-sm data-[disabled=true]:opacity-50 px-2 py-1
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "action": {
    "error": "bg-background-error border-error-300",
    "warning": "bg-background-warning border-warning-300",
    "success": "bg-background-success border-success-300",
    "info": "bg-background-info border-info-300",
    "muted": "bg-background-muted border-background-300"
  },
  "variant": {
    "solid": "",
    "outline": "border"
  },
  "size": {
    "sm": "",
    "md": "",
    "lg": ""
  }
}
```

<!-- VARIANT_STYLES_END -->

### BadgeText

<!-- BASE_STYLE_START -->

The BadgeText component uses the following base styling by default:

```css
/* Base styling applied to all BadgeText components */
text-typography-700 font-body font-normal tracking-normal uppercase
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "isTruncated": {
    "true": "web:truncate"
  },
  "bold": {
    "true": "font-bold"
  },
  "underline": {
    "true": "underline"
  },
  "strikeThrough": {
    "true": "line-through"
  },
  "sub": {
    "true": "text-xs"
  },
  "italic": {
    "true": "italic"
  },
  "highlight": {
    "true": "bg-yellow-500"
  }
}
```

### Parent-Based Styling

The styling below is applied to BadgeText based on the `action` and `size` props passed to the parent Badge component:

```json
{
  "action": {
    "error": "text-error-600",
    "warning": "text-warning-600",
    "success": "text-success-600",
    "info": "text-info-600",
    "muted": "text-background-800"
  },
  "size": {
    "sm": "text-2xs",
    "md": "text-xs",
    "lg": "text-sm"
  }
}
```

<!-- VARIANT_STYLES_END -->

### BadgeIcon

<!-- BASE_STYLE_START -->

The BadgeIcon component uses the following base styling by default:

```css
/* Base styling applied to all BadgeIcon components */
fill-none
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to BadgeIcon based on the `action` and `size` props passed to the parent Badge component:

```json
{
  "action": {
    "error": "text-error-600",
    "warning": "text-warning-600",
    "success": "text-success-600",
    "info": "text-info-600",
    "muted": "text-background-800"
  },
  "size": {
    "sm": "h-3 w-3",
    "md": "h-3.5 w-3.5",
    "lg": "h-4 w-4"
  }
}
```

## Examples

```jsx
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  BadgeCheckIcon,
  AlertCircleIcon,
  InfoIcon,
  BellIcon,
} from "lucide-react-native";

function Example() {
  return (
    <VStack space="xl">
      <HStack space="md">
        <Avatar>
          <AvatarFallbackText>SS</AvatarFallbackText>
          <AvatarImage
            source={{
              uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60",
            }}
          />
        </Avatar>
        <VStack>
          <HStack>
            <Heading size="sm">Ronald Richards</Heading>
            <Badge size="sm" variant="solid" action="success" className="ml-1">
              <BadgeText>Verified</BadgeText>
              <BadgeIcon as={BadgeCheckIcon} className="ml-1" />
            </Badge>
          </HStack>
          <Text size="sm">Nursing Assistant</Text>
        </VStack>
      </HStack>
    </VStack>
  );
}
```
