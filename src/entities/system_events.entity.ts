import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { MonitoredFile } from "./monitored_file.entity";

@Entity("processes")
export class SystemProcess {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pid: number;

  @Column({ name: "executable_path" })
  executablePath: string;
}

@Entity("system_events")
export class SystemEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "event_type" })
  eventType: string;

  @Column({ name: "event_data", type: "text", nullable: true })
  eventData: string;

  @Column({ nullable: true })
  severity: string;

  @Column({ nullable: true })
  source: string;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => MonitoredFile, { nullable: true })
  @JoinColumn({ name: "related_file_id" })
  relatedFileId: MonitoredFile;

  @ManyToOne(() => SystemProcess, { nullable: true })
  @JoinColumn({ name: "related_process_id" })
  relatedProcessId: SystemProcess;
}
