---
title: Grid
description: A flexible layout component for React & React Native that creates responsive grid layouts.
---

# Grid

Grid is a flexible layout component that creates responsive grid layouts for both web and native platforms with className styling support.

```jsx
import { Grid, GridItem } from "@/components/ui/grid";

function Example() {
  return (
    <Grid
      className="gap-5"
      _extra={{
        className: "grid-cols-8",
      }}
    >
      <GridItem
        className="bg-background-50 p-6 rounded-md"
        _extra={{
          className: "col-span-3",
        }}
      />
      <GridItem
        className="bg-background-50 p-6 rounded-md"
        _extra={{
          className: "col-span-5",
        }}
      />
      <GridItem
        className="bg-background-50 p-6 rounded-md"
        _extra={{
          className: "col-span-6",
        }}
      />
      <GridItem
        className="bg-background-50 p-6 rounded-md"
        _extra={{
          className: "col-span-4",
        }}
      />
      <GridItem
        className="bg-background-50 p-6 rounded-md"
        _extra={{
          className: "col-span-4",
        }}
      />
    </Grid>
  );
}
```

> **Important**: Our responsive grid component is based on a 12-column grid layout. It follows the CSS grid system on the web and flexbox layout on native devices. Since grid layout is only supported on web, passing grid-cols and col-span classNames inside \_extra is recommended for the grid component to work on both web and native.

> **Note**: The immediate parent of GridItem must be Grid. There should be no higher-order component (HOC) between them.

## Props

### Grid

- **\_extra**: object - Accepts `grid-cols-*` className where \* can range from 1 to 12 (default: `grid-cols-12`)
- **gap**: number - Sets the gap between grid items
- **rowGap**: number - Sets the gap between rows
- **columnGap**: number - Sets the gap between columns
- **flexDirection**: `row` | `column` | `row-reverse` | `column-reverse` - Sets the flex direction

Renders a `<div />` on web and a `View` on native.

### GridItem

- **\_extra**: object - Accepts `col-span-*` className where \* can range from 1 to 12 (default: `col-span-1`)

Renders a `<div />` on web and a `View` on native.

## Default Styling

### Grid

<!-- BASE_STYLE_START -->

The Grid component uses the following base styling by default:

```css
/* Base styling applied to all Grid components */
w-full grid grid-cols-12
```

On native platforms:

```css
/* Base styling applied to all Grid components on native */
w-full box-border flex-row flex-wrap justify-start
```

<!-- BASE_STYLE_END -->

### GridItem

<!-- BASE_STYLE_START -->

The GridItem component uses the following base styling by default:

```css
/* Base styling applied to all GridItem components */
w-full w-auto col-span-1
```

On native platforms:

```css
/* Base styling applied to all GridItem components on native */
w-full
```

<!-- BASE_STYLE_END -->

## Examples

```jsx
import { Grid, GridItem } from "@/components/ui/grid";
import { Text } from "@/components/ui/text";

function Example() {
  return (
    <Grid
      className="gap-y-2 gap-x-4"
      _extra={{
        className: "grid-cols-6",
      }}
    >
      <GridItem
        className="bg-background-50 p-4 rounded-md text-center"
        _extra={{
          className: "col-span-2",
        }}
      >
        <Text className="text-sm">01</Text>
      </GridItem>
      <GridItem
        className="bg-background-50 p-4 rounded-md text-center"
        _extra={{
          className: "col-span-2",
        }}
      >
        <Text className="text-sm">02</Text>
      </GridItem>
      {/* Additional grid items */}
    </Grid>
  );
}
```
