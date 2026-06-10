---
title: Tooltip
description: A component that displays informative text when users hover over or focus on an element.
---

# Tooltip

Tooltip is a component that displays informative text when users hover over or focus on an element with className styling support.

```jsx
import { Button, ButtonText } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipText } from "@/components/ui/tooltip";

function Example() {
  return (
    <Tooltip
      placement="top"
      trigger={(triggerProps) => {
        return (
          <Button {...triggerProps}>
            <ButtonText>Hover on me!</ButtonText>
          </Button>
        );
      }}
    >
      <TooltipContent>
        <TooltipText>Tooltip</TooltipText>
      </TooltipContent>
    </Tooltip>
  );
}
```

## Props

### Tooltip

- **placement**: `bottom` | `top` | `right` | `left` | `top left` | `top right` | `bottom left` | `bottom right` | `right top` | `right bottom` | `left top` | `left bottom` (default: `bottom left`) - Tooltip placement
- **isOpen**: boolean (default: `false`) - Whether the tooltip is opened (controlled state)
- **isDisabled**: boolean (default: `false`) - Whether the tooltip is disabled
- **defaultIsOpen**: boolean (default: `false`) - If true, the tooltip will be opened by default
- **onOpen**: () => void - Function invoked when the tooltip is opened
- **onClose**: () => void - Function invoked when tooltip is closed
- **openDelay**: number (default: `0`) - Duration in ms to wait till displaying the tooltip
- **closeDelay**: number (default: `0`) - Duration in ms to wait till hiding the tooltip
- **closeOnClick**: boolean (default: `true`) - Whether tooltip should be closed on Trigger click
- **trigger**: () => any - Function that returns a React Element used as the tooltip trigger
- **offset**: number (default: `10`) - Distance between the trigger and the tooltip
- **crossOffset**: number - Additional offset applied along the cross axis
- **shouldOverlapWithTrigger**: boolean (default: `false`) - Whether tooltip content should overlap with the trigger
- **shouldFlip**: boolean (default: `true`) - Whether the element should flip orientation when there is insufficient room
- **closeOnOverlayClick**: boolean (default: `true`) - Closes tooltip when clicked outside
- **children**: any - The content to display inside the tooltip

Inherits all the properties of React Native's View component.

### TooltipContent

Inherits all the properties of React Native's View component.

### TooltipText

- **size**: `2xs` | `xs` | `sm` | `md` | `lg` | `xl` | `2xl` | `3xl` | `4xl` | `5xl` | `6xl` - Text size
- **isTruncated**: boolean - When true, text will be truncated
- **bold**: boolean - When true, text will be bold
- **underline**: boolean - When true, text will be underlined
- **strikeThrough**: boolean - When true, text will have a line through it
- **italic**: boolean - When true, text will be italicized
- **highlight**: boolean - When true, text will have a yellow background highlight
- **sub**: boolean - Sets text size to xs

Inherits all the properties of React Native's Text component.

## Default Styling

### Tooltip

<!-- BASE_STYLE_START -->

The Tooltip component uses the following base styling by default:

```css
/* Base styling applied to all Tooltip components */
w-full h-full web:pointer-events-none
```

<!-- BASE_STYLE_END -->

### TooltipContent

<!-- BASE_STYLE_START -->

The TooltipContent component uses the following base styling by default:

```css
/* Base styling applied to all TooltipContent components */
py-1 px-3 rounded-sm bg-background-900 web:pointer-events-auto
```

<!-- BASE_STYLE_END -->

### TooltipText

<!-- BASE_STYLE_START -->

The TooltipText component uses the following base styling by default:

```css
/* Base styling applied to all TooltipText components */
font-normal tracking-normal web:select-none text-xs text-typography-50
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "isTruncated": {
    "true": {
      "props": "line-clamp-1 truncate"
    }
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
  "size": {
    "2xs": "text-2xs",
    "xs": "text-xs",
    "sm": "text-sm",
    "md": "text-base",
    "lg": "text-lg",
    "xl": "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl"
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

<!-- VARIANT_STYLES_END -->

## Accessibility

- Adheres to the WAI-ARIA design pattern
- Provides contextual information for users
- Supports keyboard navigation for focus management

## Examples

```jsx
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { Icon, EditIcon } from "@/components/ui/icon";
import { Command } from "lucide-react-native";

function Example() {
  return (
    <Box className="h-96 justify-center">
      <Tooltip
        placement="top"
        trigger={(triggerProps) => {
          return (
            <Avatar size="md" {...triggerProps} className="bg-primary-600">
              <Icon as={EditIcon} size="sm" className="text-white" />
            </Avatar>
          );
        }}
      >
        <TooltipContent className="bg-background-50 rounded-md">
          <Box className="p-2.5">
            <Text size="sm">New message</Text>
            <HStack space="xs" className="p-1 ml-3">
              <Avatar size="xs" className="bg-gray-500 rounded">
                <Icon as={Command} className="text-typography-0" />
              </Avatar>
              <Avatar size="xs" className="bg-gray-500 rounded">
                <AvatarFallbackText>N</AvatarFallbackText>
              </Avatar>
            </HStack>
          </Box>
        </TooltipContent>
      </Tooltip>
    </Box>
  );
}
```
