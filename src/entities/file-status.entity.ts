import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { File } from "./file.entity";

@Entity("file_statuses")
export class FileStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => File, { nullable: false })
  @JoinColumn({ name: "file_id" })
  file: File;

  @Column({ type: "integer" })
  status: number;

  @Column({ name: "created_at", type: "datetime" })
  created_at: Date;
}
