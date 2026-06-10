---
title: Heading
description: A customizable heading component with various size options that renders semantically correct headings.
---

# Heading

A customizable heading component with various size options that renders semantically correct headings and className for styling.

```jsx
import { Heading } from "@/components/ui/heading";

function Example() {
  return <Heading>I am a Heading</Heading>;
}
```

## Props

- **size**: `xs` | `sm` | `md` | `lg` | `xl` | `2xl` | `3xl` | `4xl` | `5xl` (default: `md`)
- **isTruncated**: boolean (default: `false`)
- **bold**: boolean (default: `false`)
- **underline**: boolean (default: `false`)
- **strikeThrough**: boolean (default: `false`)
- **italic**: boolean (default: `false`)
- **highlight**: boolean (default: `false`)
- **as**: React.ElementType (optional) - override the rendered element

### Semantic Mapping

| Size          | Web    | Native |
| ------------- | ------ | ------ |
| 5xl, 4xl, 3xl | `<h1>` | H1     |
| 2xl           | `<h2>` | H2     |
| xl            | `<h3>` | H3     |
| lg            | `<h4>` | H4     |
| md            | `<h5>` | H5     |
| sm, xs        | `<h6>` | H6     |

For Native H1, H2, H3, H4, H5, H6 are imported from '@expo/html-elements'.

## Default Styling

<!-- BASE_STYLE_START -->

The Heading component uses the following base styling by default:

```css
/* Base styling applied to all Heading components */
text-typography-900 font-bold font-heading tracking-sm my-0

/* Additional web-specific styling */
font-sans tracking-sm bg-transparent border-0 box-border display-inline list-none margin-0 padding-0 position-relative text-start no-underline whitespace-pre-wrap word-wrap-break-word
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "isTruncated": {
    "true": "truncate"
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
  },
  "size": {
    "5xl": "text-6xl",
    "4xl": "text-5xl",
    "3xl": "text-4xl",
    "2xl": "text-3xl",
    "xl": "text-2xl",
    "lg": "text-xl",
    "md": "text-lg",
    "sm": "text-base",
    "xs": "text-sm"
  }
}
```

<!-- VARIANT_STYLES_END -->

## Examples

```jsx
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";

function Example() {
  return (
    <VStack className="space-y-4">
      {/* Basic heading with custom styling */}
      <Heading className="text-2xl font-bold text-typography-800 mb-4 tracking-tight">
        I am a Heading
      </Heading>

      {/* Different size variants */}
      <Heading size="5xl" highlight>
        5XL Heading
      </Heading>
      <Heading size="xs" isTruncated>
        XS Heading
      </Heading>
    </VStack>
  );
}
```
