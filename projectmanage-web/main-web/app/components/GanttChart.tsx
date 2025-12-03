'use client';

import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttToday,
} from '@/components/ui/shadcn-io/gantt';

import groupBy from 'lodash.groupby';
import { useEffect, useState } from 'react';

interface Task {
  id: number;
  documentId?: string;
  task_name: string;
  description: string;
  task_status: string;
  due_date: string;
  createdAt: string;
  project_document_id: string;
  assigned_to_user_ids_number: number;
  assigned_to_user_ids?: any;
  project_id?: Project | null;
  attributes?: any;
}

interface Project {
  id: number;
  documentId?: string;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  project_status: string;
  created_by_user_id: any;
  created_by_user: number;
  created_by_user_info?: any;
  slug: string;
}

function mapTaskToFeature(task: Task) {
  return {
    id: task.id.toString(),
    name: task.task_name ?? "Untitled",

    startAt: new Date(task.createdAt),
    endAt: new Date(task.due_date),

    group: { name: task.project_id?.project_name ?? "Unknown" },

    description: task.description ?? "",

    color: getStatusColor(task.task_status), 

    status: {
      name: task.task_status,
      color: getStatusColor(task.task_status),
    },
  };
}


function getStatusColor(status: string) {
  switch (status) {
    case "turn in":
      return "#10B981"; // green
    case "not turn in":
      return "#EF4444"; // red
    default:
      return "#6B7280"; // gray
  }
}


export default function GanttChartPage({ tasks } : { tasks: Task[] }) {
  const [features, setFeatures] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {

      const mapped = tasks.map((t: any, p: any) => mapTaskToFeature(t));

      // console.log("MAPPED RESULT:", mapped);

      setFeatures(mapped);
    };

    load();
  }, []);

  const grouped = groupBy(features, (f) => f.group.name || "Unknown");

  return (
    <GanttProvider range="daily" zoom={150} className="border rounded-xl">

      <GanttSidebar className='mb-30'>
        {Object.entries(grouped).map(([groupName, items]) => (
          <GanttSidebarGroup key={groupName} name={groupName}>
            {items.map((feature) => (
              <GanttSidebarItem key={feature.id} feature={feature} />
            ))}
          </GanttSidebarGroup>
        ))}
      </GanttSidebar>

      <GanttTimeline>
        <GanttHeader />

        <GanttFeatureList>
          {Object.entries(grouped).map(([groupName, items]) => (
            <GanttFeatureListGroup key={groupName}>
              {items.map((feature) => (
                <GanttFeatureItem
                  key={feature.id}
                  {...feature}
                  onMove={undefined}
                >
                  <p className="text-xs truncate">{feature.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {feature.description}
                  </p>
                </GanttFeatureItem>
              ))}
            </GanttFeatureListGroup>
          ))}
        </GanttFeatureList>

        <GanttToday />
      </GanttTimeline>
    </GanttProvider>
  );
}