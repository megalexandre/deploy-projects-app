export interface ConcessionaireData {
  id: string;
  name: string;
  acronym: string;
  code: string;
  region: string;
  phone: string;
  email: string;
  active: boolean;
  logo: string | null;
}

export class Concessionaire {
  readonly id: string;
  readonly name: string;
  readonly acronym: string;
  readonly code: string;
  readonly region: string;
  readonly phone: string;
  readonly email: string;
  readonly active: boolean;
  readonly logo: string | null;

  constructor(data: ConcessionaireData) {
    this.id = data.id;
    this.name = data.name.trim();
    this.acronym = data.acronym ?? '';
    this.code = data.code ?? '';
    this.region = data.region ?? '';
    this.phone = data.phone ?? '';
    this.email = data.email ?? '';
    this.active = data.active ?? true;
    this.logo = data.logo ?? null;
  }
}
