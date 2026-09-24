'use client';

import type { FullProject } from '@/lib/api/projects';
import { uniqueProductBillingCompanies } from '@/features/projects/utils/product-billing-company';
import { ProjectCompanyCard } from './ProjectCompanyCard';

interface ProjectProductCompaniesListProps {
  project: FullProject;
}

export function ProjectProductCompaniesList({ project }: ProjectProductCompaniesListProps) {
  const companies = uniqueProductBillingCompanies(project.products);
  if (companies.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {companies.map((company) => (
        <ProjectCompanyCard key={company.id} companyId={company.id} name={company.name} />
      ))}
    </div>
  );
}
