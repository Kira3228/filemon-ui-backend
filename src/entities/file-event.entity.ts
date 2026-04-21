import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { File } from "./file.entity";

@Entity("file_events")
export class FileEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => File, { nullable: false })
  @JoinColumn({ name: "file_id" })
  file: File;

  @Column({ type: "integer" })
  event: number;

  @Column({ name: "created_at", type: "datetime" })
  created_at: Date;

  @Column({ type: "text" })
  details: string;
}
