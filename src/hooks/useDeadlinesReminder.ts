import { useEffect } from 'react';
import { Installation } from '../types';
import { createNotification } from '../services/notificationService';
import { updateDocument } from '../firestoreUtils';

export function useDeadlinesReminder(installations: Installation[]) {
  useEffect(() => {
    if (!installations || installations.length === 0) return;

    const checkDeadlines = async () => {
      const today = new Date();
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(today.getDate() + 2);

      for (const inst of installations) {
        if (!inst.stages) continue;

        let requiresUpdate = false;
        const newStages = [...inst.stages];

        for (let i = 0; i < newStages.length; i++) {
          const stage = newStages[i];
          
          if (stage.status !== 'completed' && stage.deadline) {
            const deadlineDate = new Date(stage.deadline);
            
            // Check if deadline is approaching (within 2 days) or already passed
            // and we haven't reminded yet
            const isApproaching = deadlineDate <= twoDaysFromNow;
            const notReminded = !(stage as any).reminderSent;

            if (isApproaching && notReminded) {
              await createNotification({
                userId: inst.representativeId || 'system',
                title: 'Alerta de Prazo de Etapa',
                message: `O prazo para a etapa "${stage.name}" do projeto "${inst.name}" está se aproximando: ${new Date(stage.deadline).toLocaleDateString('pt-BR')}.`,
                type: 'deadline_reminder',
                link: `/installations?id=${inst.id}`
              });

              // Mark as reminded
              (newStages[i] as any).reminderSent = true;
              requiresUpdate = true;
            }
          }
        }

        if (requiresUpdate) {
          // Update installation to prevent duplicate reminders
          await updateDocument('installations', inst.id, { stages: newStages });
        }
      }
    };

    const timeoutId = setTimeout(() => {
      checkDeadlines();
    }, 5000); // Give it some time after initial load

    return () => clearTimeout(timeoutId);
  }, [installations]);
}
