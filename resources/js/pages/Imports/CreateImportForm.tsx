import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEventHandler, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AsyncSelectInput } from '@/components/ui/async-select';
import { Party } from '@/types';

interface Props {
    onSuccess?: () => void;
}

export default function CreateImportForm({ onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, setData, errors, setError, reset, clearErrors } = useForm({
        party_id: '',
        container_no: '',
        movement_date: '',
        bl_no: '',
        bl_date: '',
        be_no: '',
        be_date: '',
        bl_weight: '',
        weigh_bridge_weight: '',
        type: 'container',
    });
    const [selectedParty, setSelectedParty] = useState<Party>(null);

    const handleSubmit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();
        setIsSubmitting(true);

        try {
            const response = await axios.post('/imports', data, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            toast.success('Import created successfully!');
            reset();
            onSuccess?.();
        } catch (error: any) {
            console.error('Error creating import:', error);
            
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                Object.keys(validationErrors).forEach((key:any) => {
                    setError(key, validationErrors[key][0]);
                });
                toast.error('Please check the form for errors.');
            } else {
                toast.error('Failed to create import. Please try again later.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPartyParams = () => {
        if (data.type === 'container') {
            return { type: 'importer' };
        } else if (data.type === 'local') {
            return { type: 'local' };
        }
        return {};
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="type">Import Type</Label>
                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select import type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="container">Via Container</SelectItem>
                            <SelectItem value="local">Local Delivery</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.type && (
                        <p className="text-destructive text-sm">{errors.type}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="party_id">Party</Label>
                    <AsyncSelectInput
                        route="/api/parties/select"
                        params={getPartyParams()}
                        value={selectedParty}
                        onChange={(selected: any) => {
                            setSelectedParty(selected);
                            setData('party_id', selected?.id || '');
                        }}
                        placeholder="Select a party"
                        renderOption={(option) => option.name}
                        renderSelected={(option) => option.name}
                    />
                    {errors.party_id && (
                        <p className="text-destructive text-sm">{errors.party_id}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="container_no">{data.type === 'container' ? 'Container Number' : 'Reference Number'}</Label>
                    <Input
                        id="container_no"
                        value={data.container_no}
                        onChange={e => setData('container_no', e.target.value)}
                        placeholder={data.type === 'container' ? 'Enter container number' : 'Enter reference number'}
                    />
                    {errors.container_no && (
                        <p className="text-destructive text-sm">{errors.container_no}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="movement_date">{data.type === 'container' ? 'Movement Date' : 'Delivery Date'}</Label>
                    <Input
                        id="movement_date"
                        type="date"
                        value={data.movement_date}
                        onChange={e => setData('movement_date', e.target.value)}
                    />
                    {errors.movement_date && (
                        <p className="text-destructive text-sm">{errors.movement_date}</p>
                    )}
                </div>

                {/* Show BL/BE fields only for container imports */}
                {data.type === 'container' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="bl_no">BL Number</Label>
                                <Input
                                    id="bl_no"
                                    value={data.bl_no}
                                    onChange={e => setData('bl_no', e.target.value)}
                                    placeholder="Enter BL number"
                                />
                                {errors.bl_no && (
                                    <p className="text-destructive text-sm">{errors.bl_no}</p>
                                )}
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="bl_date">BL Date</Label>
                                <Input
                                    id="bl_date"
                                    type="date"
                                    value={data.bl_date}
                                    onChange={e => setData('bl_date', e.target.value)}
                                />
                                {errors.bl_date && (
                                    <p className="text-destructive text-sm">{errors.bl_date}</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="be_no">BE Number</Label>
                                <Input
                                    id="be_no"
                                    value={data.be_no}
                                    onChange={e => setData('be_no', e.target.value)}
                                    placeholder="Enter BE number"
                                />
                                {errors.be_no && (
                                    <p className="text-destructive text-sm">{errors.be_no}</p>
                                )}
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="be_date">BE Date</Label>
                                <Input
                                    id="be_date"
                                    type="date"
                                    value={data.be_date}
                                    onChange={e => setData('be_date', e.target.value)}
                                />
                                {errors.be_date && (
                                    <p className="text-destructive text-sm">{errors.be_date}</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid gap-2">
                            <Label htmlFor="bl_weight">BL Weight (kg)</Label>
                            <Input
                                id="bl_weight"
                                type="number"
                                step="0.01"
                                value={data.bl_weight}
                                onChange={e => setData('bl_weight', e.target.value)}
                                placeholder="Enter BL weight"
                            />
                            {errors.bl_weight && (
                                <p className="text-destructive text-sm">{errors.bl_weight}</p>
                            )}
                        </div>
                    </>
                )}
                
                <div className="grid gap-2">
                    <Label htmlFor="weigh_bridge_weight">{data.type === 'container' ? 'Weigh Bridge Weight (kg)' : 'Total Weight (kg)'}</Label>
                    <Input
                        id="weigh_bridge_weight"
                        type="number"
                        step="0.01"
                        value={data.weigh_bridge_weight}
                        onChange={e => setData('weigh_bridge_weight', e.target.value)}
                        placeholder={data.type === 'container' ? 'Enter weigh bridge weight' : 'Enter total weight'}
                    />
                    {errors.weigh_bridge_weight && (
                        <p className="text-destructive text-sm">{errors.weigh_bridge_weight}</p>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    Create Import
                </Button>
            </DialogFooter>
        </form>
    );
}