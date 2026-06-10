---
title: Alert
description: A notification component that provides contextual feedback messages with React Native properties.
---

# Alert

A notification component for React & React Native that provides contextual feedback messages. Inherits all properties of React Native's View component with className styling support.

```jsx
import { Alert, AlertText, AlertIcon } from "@/components/ui/alert";
import { InfoIcon } from "@/components/ui/icon";

function Example() {
  return (
    <Alert>
      <AlertIcon as={InfoIcon} />
      <AlertText>Description of alert!</AlertText>
    </Alert>
  );
}
```

## Props

### Alert

- **action**: `error` | `warning` | `success` | `info` | `muted` (default: `muted`)
- **variant**: `solid` | `outline` (default: `solid`)

### AlertText

- **size**: `2xs` | `xs` | `sm` | `md` | `lg` | `xl` | `2xl` | `3xl` | `4xl` | `5xl` | `6xl` (default: `md`)
- **isTruncated**: boolean (default: `false`) - When true, text will be truncated if it exceeds its container
- **bold**: boolean (default: `false`) - When true, text will be bold
- **underline**: boolean (default: `false`) - When true, text will be underlined
- **strikeThrough**: boolean (default: `false`) - When true, text will have a line through it
- **italic**: boolean (default: `false`) - When true, text will be italicized
- **highlight**: boolean (default: `false`) - When true, text will have a yellow background highlight
- **sub**: boolean (default: `false`) - Sets text size to xs

Inherits all the properties of React Native's Text component.

### AlertIcon

- **size**: `2xs` | `xs` | `sm` | `md` | `lg` | `xl` (default: `md`)
- **as**: Required prop to specify which icon to display

Inherits all the properties of gluestack Style's AsForwarder component.

## Default Styling

### Alert

<!-- BASE_STYLE_START -->

The Alert component uses the following base styling by default:

```css
/* Base styling applied to all Alert components */
items-center py-3 px-4 rounded-md flex-row gap-2 border-outline-100
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "action": {
    "error": "bg-background-error",
    "warning": "bg-background-warning",
    "success": "bg-background-success",
    "info": "bg-background-info",
    "muted": "bg-background-muted"
  },
  "variant": {
    "solid": "",
    "outline": "border bg-background-0"
  }
}
```

<!-- VARIANT_STYLES_END -->

### AlertText

<!-- BASE_STYLE_START -->

The AlertText component uses the following base styling by default:

```css
/* Base styling applied to all AlertText components */
font-normal font-body
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

### Parent-Based Styling

The styling below is applied to AlertText based on the `action` prop passed to the parent Alert component:

```json
{
  "action": {
    "error": "text-error-800",
    "warning": "text-warning-800",
    "success": "text-success-800",
    "info": "text-info-800",
    "muted": "text-background-800"
  }
}
```

<!-- VARIANT_STYLES_END -->

### AlertIcon

<!-- BASE_STYLE_START -->

The AlertIcon component uses the following base styling by default:

```css
/* Base styling applied to all AlertIcon components */
fill-none
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "size": {
    "2xs": "h-3 w-3",
    "xs": "h-3.5 w-3.5",
    "sm": "h-4 w-4",
    "md": "h-[18px] w-[18px]",
    "lg": "h-5 w-5",
    "xl": "h-6 w-6"
  }
}
```

### Parent-Based Styling

The styling below is applied to AlertIcon based on the `action` prop passed to the parent Alert component:

```json
{
  "action": {
    "error": "text-error-800",
    "warning": "text-warning-800",
    "success": "text-success-800",
    "info": "text-info-800",
    "muted": "text-background-800"
  }
}
```

<!-- VARIANT_STYLES_END -->

## Examples

```jsx
import { Alert, AlertText, AlertIcon } from "@/components/ui/alert";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  InfoIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RepeatIcon,
} from "@/components/ui/icon";

function Example() {
  return (
    <VStack space="md">
      <Alert action="success" variant="outline">
        <AlertIcon as={CheckCircleIcon} />
        <AlertText>Operation completed successfully!</AlertText>
      </Alert>

      <Alert
        action="warning"
        className="gap-4 max-w-[516px] w-full flex-row flex py-4 items-start self-center"
      >
        <AlertIcon as={RepeatIcon} className="mt-1" />
        <HStack className="justify-between flex-1 items-center gap-1 sm:gap-8">
          <VStack className="flex-1">
            <Text className="font-semibold text-typography-900">
              Sync is disabled
            </Text>
            <AlertText className="text-typography-900" size="sm">
              Enable cloud sync to help safeguard your data
            </AlertText>
          </VStack>
          <Button size="xs">
            <ButtonText>Turn on</ButtonText>
          </Button>
        </HStack>
      </Alert>
    </VStack>
  );
}
```
