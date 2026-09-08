import type { ProjectsHubTab } from '@/features/projects/constants/projects-page-preferences-storage';

export function projectsHubEmptyCopy(tab: ProjectsHubTab): {
  title: string;
  description: string;
  showCreate: boolean;
} {
  if (tab === 'incoming') {
    return {
      title: 'No incoming projects',
      description: 'Projects appear here until they have a product or extension.',
      showCreate: true,
    };
  }
  if (tab === 'active') {
    return {
      title: 'No active projects',
      description: 'Open delivery or live maintenance shows here.',
      showCreate: true,
    };
  }
  if (tab === 'closed') {
    return {
      title: 'No closed projects',
      description: 'Finished delivery without live maintenance appears here.',
      showCreate: false,
    };
  }
  if (tab === 'trash') {
    return {
      title: 'Trash is empty',
      description: 'Deleted projects stay here until they are restored or purged.',
      showCreate: false,
    };
  }
  return {
    title: 'No projects found',
    description: 'Create your first project to get started',
    showCreate: true,
  };
}
