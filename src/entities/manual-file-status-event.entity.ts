import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { File } from "./file.entity";
import { FileStatus } from "./file-status.entity";

@Entity("manual_file_status_events")
export class ManualFileStatusEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => File, { nullable: false })
  @JoinColumn({ name: "file_id" })
  file: File;

  @ManyToOne(() => FileStatus, { nullable: true })
  @JoinColumn({ name: "status_history_id" })
  statusHistory: FileStatus;

  @Column({ type: "text" })
  action: string;

  @Column({ name: "previous_status", type: "integer" })
  previous_status: number;

  @Column({ name: "new_status", type: "integer" })
  new_status: number;

  @Column({ name: "created_at", type: "datetime" })
  created_at: Date;

  @Column({ type: "text" })
  details: string;
}
