export type CepLookupResult = {
  zip_code: string;
  street_name: string;
  neighborhood: string;
  city: string;
  federal_unit: string;
  complement?: string | null;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export async function lookupCep(cep: string): Promise<CepLookupResult | null> {
  const cleanCep = digitsOnly(cep);
  if (cleanCep.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;

  const data = await response.json() as {
    erro?: boolean;
    cep?: string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
    complemento?: string;
  };

  if (data.erro) return null;
  return {
    zip_code: digitsOnly(data.cep ?? cleanCep),
    street_name: data.logradouro ?? "",
    neighborhood: data.bairro ?? "",
    city: data.localidade ?? "",
    federal_unit: (data.uf ?? "").toUpperCase(),
    complement: data.complemento ?? "",
  };
}
