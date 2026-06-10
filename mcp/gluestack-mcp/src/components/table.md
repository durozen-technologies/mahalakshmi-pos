---
title: Table
description: A tabular data component for React & React Native that displays information in rows and columns.
---

# Table

Table is a component that displays tabular data in rows and columns with className styling support.

```jsx
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableData,
} from "@/components/ui/table";

function Example() {
  return (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead>Customer Name</TableHead>
          <TableHead>Units</TableHead>
          <TableHead>Costs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableData>Rajesh Kumar</TableData>
          <TableData>10</TableData>
          <TableData>$130</TableData>
        </TableRow>
        <TableRow>
          <TableData>Priya Sharma</TableData>
          <TableData>12</TableData>
          <TableData>$210</TableData>
        </TableRow>
        <TableRow>
          <TableData>Ravi Patel</TableData>
          <TableData>6</TableData>
          <TableData>$55</TableData>
        </TableRow>
        <TableRow>
          <TableData>Ananya Gupta</TableData>
          <TableData>18</TableData>
          <TableData>$340</TableData>
        </TableRow>
        <TableRow>
          <TableData>Arjun Singh</TableData>
          <TableData>2</TableData>
          <TableData>$35</TableData>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead>Total</TableHead>
          <TableHead>48</TableHead>
          <TableHead>$770</TableHead>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
```

## Props

### Table

Inherits all the properties of @expo/html-elements's Table on native and HTML table tag on web.

### TableHeader

Inherits all the properties of @expo/html-elements's THead on native and HTML thead tag on web.

### TableBody

Inherits all the properties of @expo/html-elements's TBody on native and HTML tbody tag on web.

### TableFooter

Inherits all the properties of @expo/html-elements's TFoot on native and HTML tfoot tag on web.

### TableHead

- **useRNView**: boolean - If true, renders a React Native View component instead of a Text component

Inherits all the properties of React Native's Text component on native and HTML th tag on web.

### TableRow

Inherits all the properties of @expo/html-elements's TR on native and HTML tr tag on web.

### TableData

- **useRNView**: boolean - If true, renders a React Native View component instead of a Text component

Inherits all the properties of React Native's Text component on native and HTML td tag on web.

### TableCaption

Inherits all the properties of @expo/html-elements's Caption on native and HTML caption tag on web.

## Default Styling

### Table

<!-- BASE_STYLE_START -->

The Table component uses the following base styling by default:

```css
/* Base styling applied to all Table components */
table border-collapse border-collapse w-[800px]
```

<!-- BASE_STYLE_END -->

### TableHeader

<!-- BASE_STYLE_START -->

The TableHeader component uses the following base styling by default:

```css
/* Base styling applied to all TableHeader components */
```

<!-- BASE_STYLE_END -->

### TableBody

<!-- BASE_STYLE_START -->

The TableBody component uses the following base styling by default:

```css
/* Base styling applied to all TableBody components */
```

<!-- BASE_STYLE_END -->

### TableFooter

<!-- BASE_STYLE_START -->

The TableFooter component uses the following base styling by default:

```css
/* Base styling applied to all TableFooter components */
```

<!-- BASE_STYLE_END -->

### TableHead

<!-- BASE_STYLE_START -->

The TableHead component uses the following base styling by default:

```css
/* Base styling applied to all TableHead components */
flex-1 px-6 py-[14px] text-left font-bold text-[16px] leading-[22px] text-typography-800 font-roboto
```

<!-- BASE_STYLE_END -->

### TableRow

<!-- BASE_STYLE_START -->

The TableRow component uses the following base styling by default:

```css
/* Base styling applied to all TableRow components */
border-0 border-b border-solid border-outline-200 bg-background-0
```

<!-- BASE_STYLE_END -->

### Default Variant Styling

<!-- VARIANT_STYLES_START -->

```json
{
  "isHeaderRow": {
    "true": ""
  },
  "isFooterRow": {
    "true": "border-b-0 "
  }
}
```

<!-- VARIANT_STYLES_END -->

### TableData

<!-- BASE_STYLE_START -->

The TableData component uses the following base styling by default:

```css
/* Base styling applied to all TableData components */
flex-1 px-6 py-[14px] text-left text-[16px] font-medium leading-[22px] text-typography-800 font-roboto
```

<!-- BASE_STYLE_END -->

### TableCaption

<!-- BASE_STYLE_START -->

The TableCaption component uses the following base styling by default:

```css
/* Base styling applied to all TableCaption components */
caption-bottom px-6 py-[14px] text-[16px] font-normal leading-[22px] text-typography-800 bg-background-50 font-roboto
```

On native platforms:

```css
/* Base styling applied to all TableCaption components on native */
px-6 py-[14px] text-[16px] font-normal leading-[22px] text-typography-800 bg-background-50 font-roboto
```

<!-- BASE_STYLE_END -->

## Examples

### Striped Table

```jsx
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableData,
} from "@/components/ui/table";

function Example() {
  return (
    <Box className="p-3 bg-background-0 rounded-lg overflow-hidden">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-b-0 bg-background-0 hover:bg-background-0">
            <TableHead className="font-bold">Order id</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Order price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="border-b-0 bg-background-50">
            <TableData>5771</TableData>
            <TableData>3</TableData>
            <TableData>Rajesh Kumar</TableData>
            <TableData>New Jersey</TableData>
            <TableData>$ 200</TableData>
            <TableData>
              <Badge
                size="sm"
                action="success"
                className="w-fit justify-center"
              >
                <BadgeText>Completed</BadgeText>
              </Badge>
            </TableData>
          </TableRow>
          <TableRow className="border-b-0 hover:bg-background-0">
            <TableData>5231</TableData>
            <TableData>2</TableData>
            <TableData>Priya Sharma</TableData>
            <TableData>Austin</TableData>
            <TableData>$ 150</TableData>
            <TableData>
              <Badge size="sm" action="info" className="w-fit justify-center">
                <BadgeText>Processing</BadgeText>
              </Badge>
            </TableData>
          </TableRow>
          {/* Additional alternating rows */}
        </TableBody>
      </Table>
    </Box>
  );
}
```
