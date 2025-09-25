# 🏷️ CATEGORY MANAGEMENT & 🔄 BULK OPERATIONS - TECHNICAL DESIGN

## 🔍 CURRENT STATE ANALYSIS ✅ COMPLETED

### Database Schema - Menu Table:
```sql
model Menu {
  id           Int     @id @default(autoincrement()) @map("menu_id")
  restaurantId Int     @map("restaurant_id")
  itemName     String  @map("item_name")
  description  String?
  price        Decimal @db.Decimal(10, 2)
  imageUrl     String? @map("image_url")
  isAvailable  Boolean @default(true) @map("is_available")
  category     String  @default("Other")  // 👈 SIMPLE STRING FIELD
}
```

### Key Findings:
- ✅ Menu items have `category` field (String type)
- ❌ No separate categories table - categories are hardcoded strings
- ❌ No category ordering, icons, or management
- ❌ No bulk operations endpoints
- ✅ Individual menu CRUD operations work well
- ✅ Authentication & authorization properly implemented

---

## 🎯 DESIGN SOLUTION ⚠️ UPDATED!

### Option A: Keep Simple String Categories 
**Pros**: 
- No database schema changes needed
- Faster implementation
- Backward compatible

**Cons**: 
- Less structured
- Harder to add category metadata later
- No proper relationships
- Difficult to implement advanced features

### Option B: Create Categories Table (RECOMMENDED ✅)
**Pros**: 
- More structured and scalable
- Can add category metadata (icons, ordering, etc.)
- Proper foreign key relationships
- Better data integrity
- Easier to implement advanced features (reordering, analytics, etc.)
- Future-proof for menu variants, modifiers, etc.

**Cons**: 
- Requires database migration
- Slightly more complex implementation

**DECISION: Go with Option B (Categories Table) - Better long-term solution!**

---

## 🏗️ IMPLEMENTATION PLAN

### PHASE 1: CATEGORY MANAGEMENT SYSTEM (With Categories Table)

#### Database Changes:
Add a new Category model and connect Menu to Category via foreign key.

Prisma schema changes (schema.prisma):
```prisma
model Category {
  id            Int        @id @default(autoincrement()) @map("category_id")
  restaurantId  Int        @map("restaurant_id")
  name          String
  slug          String     @unique
  icon          String?    // optional URL or icon name
  sortOrder     Int        @default(0) @map("sort_order")
  isActive      Boolean    @default(true) @map("is_active")
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")

  // Relations
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  menus         Menu[]

  @@unique([restaurantId, name], name: "unique_restaurant_category_name")
  @@map("categories")
}

// Update Menu model: replace `category: String` with foreign key
model Menu {
  id           Int       @id @default(autoincrement()) @map("menu_id")
  restaurantId Int       @map("restaurant_id")
  itemName     String    @map("item_name")
  description  String?
  price        Decimal   @db.Decimal(10, 2)
  imageUrl     String?   @map("image_url")
  isAvailable  Boolean   @default(true) @map("is_available")

  // New relation
  categoryId   Int?      @map("category_id")
  category     Category? @relation(fields: [categoryId], references: [id])

  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  orderItems   OrderItem[]

  @@map("menus")
}
```

Data migration strategy:
- Create categories per restaurant by selecting distinct existing `Menu.category` strings.
- Insert into Category with generated slug and incremental sortOrder.
- Update Menu rows to set `category_id` by matching old string to new Category.name.
- Drop old `category` column from Menu after data backfill.

#### Backend Changes (API):
New Category endpoints:
```http
GET    /restaurant/categories                 // List categories for logged-in restaurant
POST   /restaurant/categories                 // Create category {name, icon?, sortOrder?}
PUT    /restaurant/categories/:id             // Update category {name?, icon?, isActive?, sortOrder?}
PATCH  /restaurant/categories/reorder         // Reorder categories [{id, sortOrder}]
DELETE /restaurant/categories/:id             // Soft delete or hard delete (if no menus)
```

Enhanced Menu endpoints:
```http
PATCH  /restaurant/menu/bulk/category         // Change category for many items {menuIds, categoryId}
GET    /restaurant/menu?groupByCategory=true  // Return grouped structure
```

Authorization:
- Use authenticated user’s restaurantId for scoping all Category and Menu queries.
- Enforce unique category name per restaurant.

#### Frontend Components:
1. **CategoryManagementScreen.tsx** - Main category management interface
2. **CategoryItem.tsx** - Individual category display/edit component
3. **CategoryReorderModal.tsx** - Drag-and-drop reordering
4. **CreateCategoryModal.tsx** - Add new categories
5. **Enhanced MenuScreen** - Better category filtering

### PHASE 2: BULK OPERATIONS SYSTEM

#### Backend Changes:
1. **New Bulk API Endpoints**:
   ```http
   PATCH /restaurant/menu/bulk/availability   // Bulk availability toggle {menuIds, isAvailable}
   PATCH /restaurant/menu/bulk/category       // Bulk category change {menuIds, categoryId}
   PATCH /restaurant/menu/bulk/price          // Bulk price updates {menuIds, type: 'percentage'|'fixed', value}
   DELETE /restaurant/menu/bulk               // Bulk delete {menuIds}
   ```

Validation:
- Ensure all menuIds belong to the current restaurant
- Validate categoryId belongs to current restaurant
- Price updates: guard against negative prices; round to 2 decimals

2. **Request/Response Format**:
   ```typescript
   // Request body for bulk operations
   {
     menuIds: number[];              // Array of menu item IDs
     action: string;                 // "toggle", "enable", "disable", "delete", "updatePrice", "changeCategory"
     data?: {                        // Optional action-specific data
       isAvailable?: boolean;
       category?: string;
       priceModifier?: {
         type: 'percentage' | 'fixed';
         value: number;
       }
     }
   }
   ```

#### Frontend Components:
1. **Enhanced MenuScreen** - Add multi-select mode
2. **BulkActionToolbar.tsx** - Floating action toolbar
3. **BulkPriceModal.tsx** - Bulk price update modal
4. **BulkCategoryModal.tsx** - Bulk category change modal
5. **SelectableMenuItem.tsx** - Menu item with checkbox selection

---

## 📋 DETAILED IMPLEMENTATION ROADMAP

### STEP 1: Backend Category Management
- [ ] Add category endpoints to menuController.ts
- [ ] Update restaurant routes
- [ ] Add category grouping logic
- [ ] Test API endpoints

### STEP 2: Frontend Category Management  
- [ ] Create CategoryManagementScreen
- [ ] Add navigation to category management
- [ ] Implement category reordering
- [ ] Add category creation/editing
- [ ] Update MenuScreen category filtering

### STEP 3: Backend Bulk Operations
- [ ] Add bulk operation endpoints
- [ ] Implement bulk availability toggle
- [ ] Implement bulk category change
- [ ] Implement bulk price updates
- [ ] Implement bulk delete
- [ ] Add comprehensive error handling

### STEP 4: Frontend Bulk Operations
- [ ] Add multi-select mode to MenuScreen
- [ ] Create BulkActionToolbar component
- [ ] Implement bulk action modals
- [ ] Add visual feedback for bulk operations
- [ ] Handle bulk operation errors gracefully

### STEP 5: Integration & Testing
- [ ] Test category management flow
- [ ] Test bulk operations flow
- [ ] Error handling and edge cases
- [ ] UI/UX refinements
- [ ] Performance optimization

---

## 🎨 UI/UX DESIGN DECISIONS

### Category Management:
- **Access**: Settings button in MenuScreen header → Category Management
- **Layout**: List view with drag handles for reordering
- **Actions**: Add, rename, delete, reorder categories
- **Visual**: Category icons (optional), item counts per category

### Bulk Operations:
- **Activation**: Long press on menu item → Enter multi-select mode
- **Selection**: Checkboxes on menu items
- **Actions**: Floating toolbar at bottom with action buttons
- **Feedback**: Loading states, success/error toasts
- **Exit**: "Done" button or back gesture

---

## 🔧 TECHNICAL SPECIFICATIONS

### Category Management Data Flow:
```typescript
// 1. Get categories from menu items
const categories = await getUniqueCategories(restaurantId);

// 2. Group menu items by category  
const groupedMenu = await getMenuItemsGroupedByCategory(restaurantId);

// 3. Category operations
await updateMenuItemsCategory(menuIds, newCategory);
```

### Bulk Operations Data Flow:
```typescript
// 1. Multi-select mode
const [selectedItems, setSelectedItems] = useState<number[]>([]);

// 2. Bulk action execution
const bulkResult = await bulkUpdateMenuItems({
  menuIds: selectedItems,
  action: 'toggle_availability',
  data: { isAvailable: true }
});

// 3. Update local state
updateMenuItemsInState(bulkResult.data);
```

---

## 🚀 READY TO IMPLEMENT!

**Priority Order**:
1. 🏷️ **Category Management** (Higher impact, foundation for better UX)
2. 🔄 **Bulk Operations** (Efficiency improvement for restaurant staff)

**Estimated Timeline**:
- Category Management: 2-3 days
- Bulk Operations: 2-3 days  
- Testing & Refinement: 1 day

**Next Step**: Start with backend category management endpoints!

Would you like me to begin implementing the backend category management API endpoints first?
