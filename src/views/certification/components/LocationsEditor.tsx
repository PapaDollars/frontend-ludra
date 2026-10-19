'use client';

import { useState } from 'react';
import { Crosshair, MapPin, Plus, Trash2 } from 'lucide-react';

import type { KycLocation, SearchOptions } from '@/types';
import { Field, SelectInput } from '@/components/ui/Form';

interface LocationsEditorProps {
  locations: KycLocation[];
  options: SearchOptions | null;
  editable: boolean;
  onChange: (locations: KycLocation[]) => Promise<void>;
}

/** Biens / lieux déclarés : quartier + point GPS (« point carte »). */
export function LocationsEditor({ locations, options, editable, onChange }: LocationsEditorProps) {
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const districts = options?.cities.find((c) => c.name === city)?.districts ?? [];

  const locate = () => {
    if (!navigator.geolocation) return setError('Géolocalisation indisponible sur cet appareil.');
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint({ latitude: Number(pos.coords.latitude.toFixed(6)), longitude: Number(pos.coords.longitude.toFixed(6)) });
        setLocating(false);
      },
      () => { setError("Position refusée ou indisponible. Le quartier suffit pour l'instant."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const add = async () => {
    if (!city || !district) return setError('Choisissez la ville et le quartier.');
    setError(null);
    try {
      await onChange([...locations, { city, district, ...(point ?? {}) }]);
      setCity(''); setDistrict(''); setPoint(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible.'); }
  };

  return (
    <div className="flex flex-col gap-2">
      {locations.map((l, i) => (
        <div key={`${l.city}-${l.district}-${i}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
          <MapPin className="w-4 h-4 text-trust" />
          <span className="flex-1 text-navy">{l.district}, {l.city}</span>
          <span className="text-slate-400">{l.latitude !== undefined ? 'Point carte ✓' : 'Sans point carte'}</span>
          {editable && (
            <button type="button" onClick={() => onChange(locations.filter((_, j) => j !== i))} aria-label={`Retirer ${l.district}`} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}

      {editable && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end rounded-lg bg-surface p-3">
          <Field label="Ville" htmlFor="kyc-city">
            <SelectInput id="kyc-city" value={city} onChange={(e) => { setCity(e.target.value); setDistrict(''); }}>
              <option value="">Choisir…</option>
              {options?.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Quartier" htmlFor="kyc-district">
            <SelectInput id="kyc-district" value={district} disabled={!city} onChange={(e) => setDistrict(e.target.value)}>
              <option value="">Choisir…</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </SelectInput>
          </Field>
          <div className="flex gap-2">
            <button type="button" onClick={locate} disabled={locating} title="Enregistrer ma position comme point carte"
              className="h-10 px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-navy disabled:opacity-50">
              <Crosshair className="w-4 h-4" /> {point ? 'Point ✓' : locating ? '…' : 'Ma position'}
            </button>
            <button type="button" onClick={add} className="h-10 px-3 inline-flex items-center gap-1 rounded-lg bg-brand text-white text-xs font-semibold">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
          {error && <p role="alert" className="sm:col-span-3 text-[11px] text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
