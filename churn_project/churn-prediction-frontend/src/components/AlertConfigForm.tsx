"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { ApiService } from "@/lib/api"
import { Icons } from "@/lib/icons"

const alertConfigSchema = z.object({
  webhook_url: z.string().url("Please enter a valid Discord webhook URL"),
  is_enabled: z.boolean(),
  high_risk_threshold: z.number().min(0).max(1, "Must be between 0 and 1"),
  risk_increase_threshold: z.number().min(0).max(100, "Must be between 0 and 100"),
})

type AlertConfig = z.infer<typeof alertConfigSchema>

export function AlertConfigForm() {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<AlertConfig>({
    resolver: zodResolver(alertConfigSchema),
    defaultValues: {
      webhook_url: "",
      is_enabled: false,
      high_risk_threshold: 0.7,
      risk_increase_threshold: 20,
    },
  })

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true)
        const config = await ApiService.getAlertConfig()
        form.reset(config)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load alert configuration",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [form])

  const onSubmit = async (data: AlertConfig) => {
    try {
      setIsLoading(true)
      await ApiService.updateAlertConfig(data)
      toast({
        title: "Success",
        description: "Alert configuration updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update alert configuration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Configuration</CardTitle>
        <CardDescription>
          Configure Discord webhook and risk thresholds for automated alerts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="webhook_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discord Webhook URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://discord.com/api/webhooks/..." {...field} />
                  </FormControl>
                  <FormDescription>
                    The webhook URL for your Discord channel where alerts will be sent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Alerts</FormLabel>
                    <FormDescription>
                      Receive alerts when customers are at high risk of churning
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="high_risk_threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>High Risk Threshold</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Alert when a customer's churn probability exceeds this value (0-1)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_increase_threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Increase Threshold (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="5"
                      min="0"
                      max="100"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Alert when a customer's churn probability increases by this percentage
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 