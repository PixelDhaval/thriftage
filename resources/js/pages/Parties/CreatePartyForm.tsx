import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEventHandler, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    onSuccess?: () => void;
}

export default function CreatePartyForm({ onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, setData, errors, setError, reset, clearErrors } = useForm({
        name: '',
        type: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: '',
        email: '',
        gst: '',
    });

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            const response = await axios.post('/parties', data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            toast.success('Party created successfully!');
            reset();
            onSuccess?.();
        } catch (error: any) {
            console.error('Error creating party:', error);
            
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach((key:any) => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to create party. Please try again later.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        required
                        placeholder="Enter party name"
                    />
                    {errors.name && (
                        <p className="text-destructive text-sm">{errors.name}</p>
                    )}
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="importer">Importer</SelectItem>
                            <SelectItem value="supplier">Supplier</SelectItem>
                            <SelectItem value="exporter">Exporter</SelectItem>
                            <SelectItem value="local">Local</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.type && (
                        <p className="text-destructive text-sm">{errors.type}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="address_line_1">Address Line 1</Label>
                    <Input
                        id="address_line_1"
                        value={data.address_line_1}
                        onChange={e => setData('address_line_1', e.target.value)}
                        placeholder="Enter address line 1"
                    />
                    {errors.address_line_1 && (
                        <p className="text-destructive text-sm">{errors.address_line_1}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="address_line_2">Address Line 2</Label>
                    <Input
                        id="address_line_2"
                        value={data.address_line_2}
                        onChange={e => setData('address_line_2', e.target.value)}
                        placeholder="Enter address line 2"
                    />
                    {errors.address_line_2 && (
                        <p className="text-destructive text-sm">{errors.address_line_2}</p>
                    )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                            id="city"
                            value={data.city}
                            onChange={e => setData('city', e.target.value)}
                            placeholder="Enter city"
                        />
                        {errors.city && (
                            <p className="text-destructive text-sm">{errors.city}</p>
                        )}
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                            id="state"
                            value={data.state}
                            onChange={e => setData('state', e.target.value)}
                            placeholder="Enter state"
                        />
                        {errors.state && (
                            <p className="text-destructive text-sm">{errors.state}</p>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                            id="zip"
                            value={data.zip}
                            onChange={e => setData('zip', e.target.value)}
                            placeholder="Enter ZIP code"
                        />
                        {errors.zip && (
                            <p className="text-destructive text-sm">{errors.zip}</p>
                        )}
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                            id="country"
                            value={data.country}
                            onChange={e => setData('country', e.target.value)}
                            placeholder="Enter country"
                        />
                        {errors.country && (
                            <p className="text-destructive text-sm">{errors.country}</p>
                        )}
                    </div>
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        value={data.phone}
                        onChange={e => setData('phone', e.target.value)}
                        placeholder="Enter phone number"
                    />
                    {errors.phone && (
                        <p className="text-destructive text-sm">{errors.phone}</p>
                    )}
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        placeholder="Enter email address"
                    />
                    {errors.email && (
                        <p className="text-destructive text-sm">{errors.email}</p>
                    )}
                </div>
                
                <div className="grid gap-2">
                    <Label htmlFor="gst">GST Number</Label>
                    <Input
                        id="gst"
                        value={data.gst}
                        onChange={e => setData('gst', e.target.value)}
                        placeholder="Enter GST number"
                    />
                    {errors.gst && (
                        <p className="text-destructive text-sm">{errors.gst}</p>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    Create Party
                </Button>
            </DialogFooter>
        </form>
    );
}