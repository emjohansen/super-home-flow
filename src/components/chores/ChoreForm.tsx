
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Chore, HouseholdMember, Recurrence } from '@/types/chore';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  recurrence: z.string().optional(),
  difficulty: z.number().min(1).max(5),
  estimated_minutes: z.number().min(1).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ChoreFormProps {
  onSubmit: (chore: Partial<Chore>) => void;
  initialValues?: Partial<Chore>;
  members: HouseholdMember[];
  householdId: string;
  isEditing?: boolean;
}

export const ChoreForm: React.FC<ChoreFormProps> = ({
  onSubmit,
  initialValues,
  members,
  householdId,
  isEditing = false,
}) => {
  const { currentUser } = useAuth();
  const [isRecurring, setIsRecurring] = useState<boolean>(
    !!initialValues?.recurrence && initialValues.recurrence !== 'once'
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      assigned_to: initialValues?.assigned_to || '',
      due_date: initialValues?.due_date 
        ? format(new Date(initialValues.due_date), 'yyyy-MM-dd')
        : '',
      recurrence: initialValues?.recurrence || 'once',
      difficulty: initialValues?.difficulty || 1,
      estimated_minutes: initialValues?.estimated_minutes || 10,
    },
  });

  const handleSubmit = (values: FormValues) => {
    if (!currentUser) return;
    
    const choreData: Partial<Chore> = {
      ...values,
      household_id: householdId,
      recurrence: isRecurring ? (values.recurrence as Recurrence) : 'once',
      created_by: currentUser.id,
    };
    
    // Convert due_date from input format to ISO string if provided
    if (values.due_date) {
      choreData.due_date = new Date(values.due_date).toISOString();
    }
    
    onSubmit(choreData);
  };

  const recurrenceOptions: Array<{ label: string; value: Recurrence }> = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Biweekly', value: 'biweekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chore Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter chore name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the chore" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assigned_to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign To</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a household member" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.display_name || 'Household member'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <div className="flex items-center gap-2">
            <FormLabel>Recurring Chore</FormLabel>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="accent-primary h-4 w-4"
            />
          </div>
        </FormItem>

        {isRecurring && (
          <FormField
            control={form.control}
            name="recurrence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recurrence Pattern</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recurrence pattern" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {recurrenceOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Difficulty (1-5)</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                  />
                  <div className="flex justify-between text-xs">
                    <span>Very Easy</span>
                    <span>Very Hard</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimated_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Time (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  value={field.value}
                />
              </FormControl>
              <FormDescription>
                How long will this take to complete?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit">
            {isEditing ? 'Update Chore' : 'Create Chore'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
