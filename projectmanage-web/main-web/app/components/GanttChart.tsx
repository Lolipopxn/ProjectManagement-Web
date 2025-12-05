'use client';

import {
  GanttCreateMarkerTrigger,
  GanttFeatureItem,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttHeader,
  GanttMarker,
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttToday,
} from '@/components/ui/shadcn-io/gantt';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EyeIcon, LinkIcon, TrashIcon } from 'lucide-react';

import groupBy from 'lodash.groupby';
import { useEffect, useState } from 'react';

import { VscGithubProject } from "react-icons/vsc";
import { BiTask } from "react-icons/bi";
import { GoProjectRoadmap } from "react-icons/go";
import { IoMdTime } from "react-icons/io";
import { GrStatusGood } from "react-icons/gr";
import { RiGroupLine } from "react-icons/ri";

import { useRouter } from "next/navigation";


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
  assigned_to_user_ids?: User[] | null;
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

interface User {
  id: number;
  documentId?: string;
  username: string;
  email: string;
}

function mapTaskToFeature(task: Task) {
  return {
    id: task.id.toString(),
    docId: task.documentId,
    name: task.task_name ?? "Untitled",
    startAt: new Date(task.createdAt),
    endAt: new Date(task.due_date),
    group: { name: task.project_id?.project_name ?? "ไม่มี", projectId: task.project_id?.documentId},
    description: task.description ?? "",
    color: getTaskColor(), 
    member_name: { name: task.assigned_to_user_ids?.length ? task.assigned_to_user_ids.map(u => u.username).join(',') : "ไม่มี" },
    status: {
      name: task.task_status,
      nameThai: getTextStatus(task.task_status),
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

function getTextStatus(status: string) {
  switch (status) {
    case "turn in":
      return "ส่งเเล้ว";
    case "not turn in":
      return "ยังไม่ส่ง";
    default:
      return "ไม่ระบุ";
  }
}

function getTaskColor() {
  const randomIndex = Math.floor(Math.random() * pastelColors.length);
  return pastelColors[randomIndex];
}

const pastelColors = [
  "#F9A8D4", // Pink
  "#A5F3FC", // Sky
  "#FDE68A", // Yellow
  "#C7D2FE", // Indigo
  "#BBF7D0", // Green
];

export default function GanttChartPage({ tasks } : { tasks: Task[] }) {
  const [features, setFeatures] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const mapped = tasks.map((t: any, p: any) => mapTaskToFeature(t));
      // console.log("MAPPED RESULT:", mapped);
      setFeatures(mapped);
    };

    load();
  }, []);

  const grouped = groupBy(features, (f) => f.group.name || "Unknown");

  const handleViewFeature = (feature: any) =>
    router.push(`/main_pages/projects/${feature.group.projectId}/tasks/${feature.docId}`);

  const handleCopyLink = (id: string) => console.log(`Copy link: ${id}`);

  const handleRemoveFeature = (id: string) =>
    setFeatures((prev) => prev.filter((feature) => feature.id !== id));

  const handleRemoveMarker = (id: string) =>
    console.log(`Remove marker: ${id}`);

  const handleCreateMarker = (date: Date) =>
    console.log(`Create marker: ${date.toISOString()}`);

  const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
    if (!endAt) {
      return;
    }
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === id ? { ...feature, startAt, endAt } : feature
      )
    );
    console.log(`Move feature: ${id} from ${startAt} to ${endAt}`);
  };
  const handleAddFeature = (date: Date) =>
    console.log(`Add feature: ${date.toISOString()}`);

  return (
    <GanttProvider range="daily" zoom={150} className="border border-gray-200 shadow-md">

      <GanttSidebar className='mb-60 md:mb-30'>
        {Object.entries(grouped).map(([group, features]) => (
          <GanttSidebarGroup key={group} name={group}>
            {features.map((feature) => (
              <GanttSidebarItem
                feature={feature}
                key={feature.id}
                // onSelectItem={handleViewFeature}
              />
            ))}
          </GanttSidebarGroup>
        ))}
      </GanttSidebar>
      <GanttTimeline>
        <GanttHeader />
        <GanttFeatureList>
          {Object.entries(grouped).map(([group, features]) => (
            <GanttFeatureListGroup key={group}>
              {features.map((feature) => (
                <div className="flex group" key={feature.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => handleViewFeature(feature)}
                        type="button" 
                        className='group'
                      >
                        <GanttFeatureItem
                          onMove={handleMoveFeature}
                          {...feature}
                        >
                          <p className="flex-1 truncate text-xs">
                            {feature.name}
                          </p>
                          {feature.owner ? (
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={feature.owner.image} />
                              <AvatarFallback>
                                {feature.owner.name?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          ): <p>{feature.status.nameThai}</p>}
                        </GanttFeatureItem>
                        
                      </button>
                    </ContextMenuTrigger>
                    <div className='fixed group-hover:fixed group-hover:h-full group-hover:w-100 right-0 top-0 bg-[white] h-0 w-0 z-30 shadow-md'>
                      <div className='flex group-hover:flex flex-col mt-25 py-1 px-6 space-y-5 divide-gray-500'>
                        <hr></hr>               
                          <div className='grid grid-cols-2 text-sm space-y-5 gap-2 px-5 py-5 rounded-lg '>
                            <div className='col-span-1 font-bold'>
                              <div className='flex flex-row gap-3 items-center text-gray-500'>
                                <VscGithubProject className='w-4 h-4'/>
                                <p>ชื่อโปรเจค</p>
                              </div>
                            </div>
                            <div className='col-span-1 font-normal'>
                              <p className=''>{feature.group.name}</p>
                            </div> 

                            <div className='col-span-1 font-bold'>
                              <div className='flex flex-row gap-3 items-center text-gray-500'>
                                <BiTask className='w-4 h-4'/>
                                <p>ชื่องาน</p>
                              </div>
                            </div>
                            <div className='col-span-1 font-normal'>
                              <p className=''>{feature.name}</p>
                            </div>    

                            <div className='col-span-2 font-bold'>
                              <div className='flex flex-row gap-3 items-center text-gray-500'>
                                <GoProjectRoadmap className='w-4 h-4'/>
                                <p>คำอธิบาย</p>
                              </div>
                            </div>
                            <div className='col-span-2 font-normal bg-gray-50 py-2 px-2 border rounded-lg overflow-auto h-25'>
                              <p className=''>{feature.description}</p>
                            </div>    

                            <div className='col-span-1 font-bold'>
                              <div className='flex flex-row gap-3 items-center text-gray-500'>
                                <IoMdTime className='w-4 h-4'/>
                                <p>เวลา</p>
                              </div>
                            </div>
                            <div className='col-span-1 font-normal'>
                              <p>{new Date(feature.startAt).toLocaleDateString()}  -  {new Date (feature.endAt).toLocaleDateString()}</p>
                            </div> 

                            <div className='col-span-1 font-bold'>
                              <div className='flex flex-row gap-3 items-center text-gray-500'>
                                <GrStatusGood className='w-4 h-4'/>
                                <p>สถานะ</p>
                              </div>
                            </div>
                            <div className='col-span-1 font-normal'>
                              <div className='flex py-1 w-1/2 justify-center items-center rounded-[25px]' style={{ backgroundColor: feature.status.color }}>
                                <p style={{ color: 'white' }}>{feature.status.nameThai}</p>
                              </div>                             
                            </div>   
                            <div className='col-span-1 font-bold'>
                              <div className='flex flex-row gap-3 items-center text-gray-500'>
                                <RiGroupLine className='w-4 h-4'/>
                                <p>ผู้รับผิดชอบ</p>
                              </div>
                            </div>
                            <div className='col-span-1 font-normal'>
                              <p className=''>{feature.member_name.name}</p>
                            </div>                                   
                            
                            {/* <div className='col-span-2 space-y-2'>
                              <p>คำอธิบาย</p>
                              <p>สถานะ</p>
                              <p>{feature.description}</p>
                              <p>{feature.status.name}</p>
                            </div> */}
                          </div>
                      </div> 
                    </div>
                    <ContextMenuContent>
                      <ContextMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleViewFeature(feature.id)}
                      >
                        <EyeIcon className="text-muted-foreground" size={16} />
                        View feature
                      </ContextMenuItem>
                      <ContextMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleCopyLink(feature.id)}
                      >
                        <LinkIcon className="text-muted-foreground" size={16} />
                        Copy link
                      </ContextMenuItem>
                      <ContextMenuItem
                        className="flex items-center gap-2 text-destructive"
                        onClick={() => handleRemoveFeature(feature.id)}
                      >
                        <TrashIcon size={16} />
                        Remove from roadmap
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                  
                </div>
              ))}
            </GanttFeatureListGroup>
          ))}
        </GanttFeatureList>
        <GanttToday />
        <GanttCreateMarkerTrigger onCreateMarker={handleCreateMarker} />
      </GanttTimeline>
    </GanttProvider>
  );
};
