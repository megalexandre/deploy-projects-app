import React from 'react';
import { maskLatitude, maskLongitude } from '@/core/utils/masks';
import type { DadosDetalhesForm } from '@/features/projects/domain/types';
import { FormField } from './FormField';
import { inputCls } from './fieldCls';

interface CoordenadasFieldsProps {
  coordenadas: DadosDetalhesForm['coordenadas'];
  linkMapa: string;
  setDetalhesProjeto: React.Dispatch<React.SetStateAction<DadosDetalhesForm>>;
}

export const CoordenadasFields: React.FC<CoordenadasFieldsProps> = ({
  coordenadas,
  linkMapa,
  setDetalhesProjeto,
}) => (
  <>
    <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-12">
      <div className="md:col-span-5">
        <FormField label="Latitude">
          <input
            value={coordenadas.latitude}
            onChange={(e) =>
              setDetalhesProjeto((prev) => ({
                ...prev,
                coordenadas: { ...prev.coordenadas, latitude: maskLatitude(e.target.value) },
              }))
            }
            inputMode="decimal"
            placeholder="-27.123456"
            className={inputCls}
          />
        </FormField>
      </div>
      <div className="md:col-span-7">
        <FormField label="Longitude">
          <input
            value={coordenadas.longitude}
            onChange={(e) =>
              setDetalhesProjeto((prev) => ({
                ...prev,
                coordenadas: { ...prev.coordenadas, longitude: maskLongitude(e.target.value) },
              }))
            }
            inputMode="decimal"
            placeholder="-54.321987"
            className={inputCls}
          />
        </FormField>
      </div>
    </div>
    <div className="md:col-span-2">
      <FormField label="Link do Google Maps">
        <input
          value={linkMapa}
          onChange={(e) => setDetalhesProjeto((prev) => ({ ...prev, linkMapa: e.target.value }))}
          placeholder="https://maps.google.com/..."
          className={inputCls}
        />
      </FormField>
    </div>
  </>
);
