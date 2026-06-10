---
title: Button
description: Interactive component for triggering actions with React Native properties and className styling.
---

# Button

A versatile button component for React & React Native with customizable properties. Inherits all properties of React Native's Pressable component with className styling support.

```jsx
import { Button, ButtonText } from "@/components/ui/button";

function Example() {
  return (
    <Button>
      <ButtonText>Hello World!</ButtonText>
    </Button>
  );
}
```

## Props

### Button

- **action**: `primary` | `secondary` | `positive` | `negative` | `default` (default: `primary`)
- **variant**: `link` | `outline` | `solid` (default: `solid`)
- **size**: `xs` | `sm` | `md` | `lg` | `xl` (default: `md`)
- **isDisabled**: boolean (default: `false`)

### ButtonText

Inherits all Text component properties.

### ButtonIcon

Component for adding icons to buttons.

### ButtonSpinner

Shows loading state in buttons.

### ButtonGroup

Container for multiple buttons with space and flexDirection properties.

- **space**: `xs` | `sm` | `md` | `lg` | `xl` | `2xl` | `3xl` | `4xl`
- **isAttached**: boolean (default: `false`)
- **flexDirection**: `row` | `column` | `row-reverse` | `column-reverse` (default: `row`)

## Default Styling

### Button

<!-- BASE_STYLE_START -->

The Button component uses the following base styling by default:

```css
/* Base styling applied to all Button components */
rounded bg-primary-500 flex-row items-center justify-center data-[focus-visible=true]:web:outline-none data-[focus-visible=true]:web:ring-2 data-[disabled=true]:opacity-40 gap-2
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "action": {
    "primary": "bg-primary-500 data-[hover=true]:bg-primary-600 data-[active=true]:bg-primary-700 border-primary-300 data-[hover=true]:border-primary-400 data-[active=true]:border-primary-500 data-[focus-visible=true]:web:ring-indicator-info",
    "secondary": "bg-secondary-500 border-secondary-300 data-[hover=true]:bg-secondary-600 data-[hover=true]:border-secondary-400 data-[active=true]:bg-secondary-700 data-[active=true]:border-secondary-700 data-[focus-visible=true]:web:ring-indicator-info",
    "positive": "bg-success-500 border-success-300 data-[hover=true]:bg-success-600 data-[hover=true]:border-success-400 data-[active=true]:bg-success-700 data-[active=true]:border-success-500 data-[focus-visible=true]:web:ring-indicator-info",
    "negative": "bg-error-500 border-error-300 data-[hover=true]:bg-error-600 data-[hover=true]:border-error-400 data-[active=true]:bg-error-700 data-[active=true]:border-error-500 data-[focus-visible=true]:web:ring-indicator-info",
    "default": "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent"
  },
  "variant": {
    "link": "px-0",
    "outline": "bg-transparent border data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent",
    "solid": ""
  },
  "size": {
    "xs": "px-3.5 h-8",
    "sm": "px-4 h-9",
    "md": "px-5 h-10",
    "lg": "px-6 h-11",
    "xl": "px-7 h-12"
  }
}
```

### Compound Variants

These styles are applied when specific combinations of props are used:

```json
[
  {
    "action": "primary",
    "variant": "link",
    "class": "px-0 bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent"
  },
  {
    "action": "secondary",
    "variant": "link",
    "class": "px-0 bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent"
  },
  {
    "action": "positive",
    "variant": "link",
    "class": "px-0 bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent"
  },
  {
    "action": "negative",
    "variant": "link",
    "class": "px-0 bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent"
  },
  {
    "action": "primary",
    "variant": "outline",
    "class": "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent"
  },
  {
    "action": "secondary",
    "variant": "outline",
    "class": "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent"
  },
  {
    "action": "positive",
    "variant": "outline",
    "class": "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent"
  },
  {
    "action": "negative",
    "variant": "outline",
    "class": "bg-transparent data-[hover=true]:bg-background-50 data-[active=true]:bg-transparent"
  }
]
```

<!-- VARIANT_STYLES_END -->

### ButtonText

<!-- BASE_STYLE_START -->

The ButtonText component uses the following base styling by default:

```css
/* Base styling applied to all ButtonText components */
text-typography-0 font-semibold web:select-none
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to ButtonText based on the props passed to the parent Button component:

```json
{
  "action": {
    "primary": "text-primary-600 data-[hover=true]:text-primary-600 data-[active=true]:text-primary-700",
    "secondary": "text-typography-500 data-[hover=true]:text-typography-600 data-[active=true]:text-typography-700",
    "positive": "text-success-600 data-[hover=true]:text-success-600 data-[active=true]:text-success-700",
    "negative": "text-error-600 data-[hover=true]:text-error-600 data-[active=true]:text-error-700"
  },
  "variant": {
    "link": "data-[hover=true]:underline data-[active=true]:underline",
    "outline": "",
    "solid": "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0"
  },
  "size": {
    "xs": "text-xs",
    "sm": "text-sm",
    "md": "text-base",
    "lg": "text-lg",
    "xl": "text-xl"
  }
}
```

### Parent Compound Variants

These styles override the parent-based styling when specific combinations of props are used on the parent Button:

```json
[
  {
    "variant": "solid",
    "action": "primary",
    "class": "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0"
  },
  {
    "variant": "solid",
    "action": "secondary",
    "class": "text-typography-800 data-[hover=true]:text-typography-800 data-[active=true]:text-typography-800"
  },
  {
    "variant": "solid",
    "action": "positive",
    "class": "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0"
  },
  {
    "variant": "solid",
    "action": "negative",
    "class": "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0"
  },
  {
    "variant": "outline",
    "action": "primary",
    "class": "text-primary-500 data-[hover=true]:text-primary-500 data-[active=true]:text-primary-500"
  },
  {
    "variant": "outline",
    "action": "secondary",
    "class": "text-typography-500 data-[hover=true]:text-primary-600 data-[active=true]:text-typography-700"
  },
  {
    "variant": "outline",
    "action": "positive",
    "class": "text-primary-500 data-[hover=true]:text-primary-500 data-[active=true]:text-primary-500"
  },
  {
    "variant": "outline",
    "action": "negative",
    "class": "text-primary-500 data-[hover=true]:text-primary-500 data-[active=true]:text-primary-500"
  }
]
```

### ButtonIcon

<!-- BASE_STYLE_START -->

The ButtonIcon component uses the following base styling by default:

```css
/* Base styling applied to all ButtonIcon components */
fill-none
```

<!-- BASE_STYLE_END -->

### Parent-Based Styling

The styling below is applied to ButtonIcon based on the props passed to the parent Button component:

```json
{
  "variant": {
    "link": "data-[hover=true]:underline data-[active=true]:underline",
    "outline": "",
    "solid": "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0"
  },
  "size": {
    "xs": "h-3.5 w-3.5",
    "sm": "h-4 w-4",
    "md": "h-[18px] w-[18px]",
    "lg": "h-[18px] w-[18px]",
    "xl": "h-5 w-5"
  },
  "action": {
    "primary": "text-primary-600 data-[hover=true]:text-primary-600 data-[active=true]:text-primary-700",
    "secondary": "text-typography-500 data-[hover=true]:text-typography-600 data-[active=true]:text-typography-700",
    "positive": "text-success-600 data-[hover=true]:text-success-600 data-[active=true]:text-success-700",
    "negative": "text-error-600 data-[hover=true]:text-error-600 data-[active=true]:text-error-700"
  }
}
```

### Parent Compound Variants

These styles override the parent-based styling when specific combinations of props are used on the parent Button:

```json
[
  {
    "variant": "solid",
    "action": "primary",
    "class": "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0"
  },
  {
    "variant": "solid",
    "action": "secondary",
    "class": "text-typography-800 data-[hover=true]:text-typography-800 data-[active=true]:text-typography-800"
  },
  {
    "variant": "solid",
    "action": "positive",
    "class": "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0"
  },
  {
    "variant": "solid",
    "action": "negative",
    "class": "text-typography-0 data-[hover=true]:text-typography-0 data-[active=true]:text-typography-0"
  }
]
```

### ButtonGroup

<!-- BASE_STYLE_START -->

The ButtonGroup component uses the following base styling by default:

```css
/* Base styling applied to all ButtonGroup components */
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

```json
{
  "space": {
    "xs": "gap-1",
    "sm": "gap-2",
    "md": "gap-3",
    "lg": "gap-4",
    "xl": "gap-5",
    "2xl": "gap-6",
    "3xl": "gap-7",
    "4xl": "gap-8"
  },
  "isAttached": {
    "true": "gap-0"
  },
  "flexDirection": {
    "row": "flex-row",
    "column": "flex-col",
    "row-reverse": "flex-row-reverse",
    "column-reverse": "flex-col-reverse"
  }
}
```

## Examples

```jsx
import {
  Button,
  ButtonText,
  ButtonIcon,
  ButtonGroup,
  ButtonSpinner,
} from "@/components/ui/button";
import {
  ArrowUpIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
} from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";

function Example() {
  return (
    <VStack space="xl">
      {/* Basic button with custom styling */}
      <Button
        size="sm"
        className="bg-blue-300 data-[hover=true]:bg-blue-400 data-[active=true]:bg-blue-400 rounded-full shadow-md"
      >
        <ButtonText className="font-medium text-typography-900">
          Back to top
        </ButtonText>
        <ButtonIcon
          as={ArrowUpIcon}
          className="h-3 w-3 text-background-900 ml-1"
        />
      </Button>

      {/* Attached buttons */}
      <ButtonGroup isAttached={true}>
        <Button action="secondary" variant="outline" className="rounded-r-none">
          <ButtonText>Previous</ButtonText>
        </Button>
        <Button action="secondary" variant="outline" className="rounded-l-none">
          <ButtonText>Next</ButtonText>
        </Button>
      </ButtonGroup>
    </VStack>
  );
}
```
