import { Text, View } from 'react-native';
import { SKILL_MILESTONES, type MilestoneLogInput } from '../lib/skillMilestones';
import type { SkillKey } from '../types/database';

export function SkillMilestoneBadges({ skillKey, logs }: { skillKey: SkillKey; logs: MilestoneLogInput[] }) {
  const milestones = SKILL_MILESTONES[skillKey];

  return (
    <View className="flex-row flex-wrap gap-2">
      {milestones.map((milestone) => {
        const unlocked = milestone.check(logs);
        return (
          <View
            key={milestone.id}
            className={`rounded-full border px-3 py-1.5 ${unlocked ? 'border-accent bg-accentDim/40' : 'border-textMuted/25 bg-surface'}`}
          >
            <Text className={`font-bodyMedium text-xs ${unlocked ? 'text-text' : 'text-textMuted'}`}>
              {unlocked ? '✓ ' : ''}
              {milestone.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
