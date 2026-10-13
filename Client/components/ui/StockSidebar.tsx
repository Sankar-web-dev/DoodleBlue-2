import React from 'react'
import Link from 'next/link'
import { 
  Package, 
  PackagePlus, 
  ShoppingCart, 
  FileText, 
  Layers 
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet'

export function StockSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Layers className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px]">
        <SheetHeader>
          <SheetTitle>Stock Management</SheetTitle>
        </SheetHeader>
        
        <nav className="mt-6 space-y-4">
          <div>
            <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground">
              Products
            </h3>
            <div className="space-y-1">
              <SidebarLink 
                href="/products" 
                icon={<Package className="mr-2 h-4 w-4" />} 
                label="View Products" 
              />
              <SidebarLink 
                href="/products/create" 
                icon={<PackagePlus className="mr-2 h-4 w-4" />} 
                label="Add Product" 
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground">
              Stocks
            </h3>
            <div className="space-y-1">
            
              <SidebarLink 
                href="/stocks/update" 
                icon={<Layers className="mr-2 h-4 w-4" />} 
                label="Update Stock" 
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground">
              Orders
            </h3>
            <div className="space-y-1">
              <SidebarLink 
                href="/orders" 
                icon={<ShoppingCart className="mr-2 h-4 w-4" />} 
                label="View Orders" 
              />
              <SidebarLink 
                href="/orders/create" 
                icon={<FileText className="mr-2 h-4 w-4" />} 
                label="Create Order" 
              />
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

interface SidebarLinkProps {
  href: string
  icon: React.ReactNode
  label: string
}

function SidebarLink({ href, icon, label }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <Button 
        variant="ghost" 
        className="w-full justify-start"
      >
        {icon}
        {label}
      </Button>
    </Link>
  )
}
