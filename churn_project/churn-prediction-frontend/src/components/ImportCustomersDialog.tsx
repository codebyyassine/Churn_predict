"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { ApiService } from "@/lib/api"
import { Icons } from "@/lib/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ImportCustomersDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) {
      setFile(null)
      return
    }

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive",
      })
      e.target.value = '' // Reset file input
      setFile(null)
      return
    }

    setFile(selectedFile)
    setUploadResult(null) // Reset previous results
  }

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      setUploadResult(null)
      const result = await ApiService.importCustomersCSV(file, updateExisting)
      
      if (result.status === 'success') {
        setUploadResult({
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
        })
        toast({
          title: "Import Successful",
          description: `Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`,
        })
        // Don't close dialog immediately so user can see the results
      } else {
        toast({
          title: "Import Failed",
          description: result.message || "An error occurred during import",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Import failed:', error)
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import customers",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setFile(null)
      setUploadResult(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        <Button variant="outline">Import CSV</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Customers</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing customer data. The file must include all required fields.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isUploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected file: {file.name}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="update-existing"
              checked={updateExisting}
              onCheckedChange={setUpdateExisting}
              disabled={isUploading}
            />
            <Label htmlFor="update-existing">Update existing records</Label>
          </div>

          {uploadResult && (
            <Alert>
              <AlertDescription>
                <div className="space-y-1">
                  <p>Import Results:</p>
                  <ul className="list-disc list-inside text-sm">
                    <li>Created: {uploadResult.created} records</li>
                    <li>Updated: {uploadResult.updated} records</li>
                    <li>Skipped: {uploadResult.skipped} records</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isUploading}
          >
            {isUploading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isUploading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 