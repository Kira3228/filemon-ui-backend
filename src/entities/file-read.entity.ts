import {
  Column, Entity, Index,
  JoinColumn, ManyToOne, PrimaryColumn,
} from "typeorm";
import { File } from "./file.entity";
import { FileVersion } from "./file-version.entity";
import { ProcessVersion } from "./process-version";

@Entity("file_reads")
export class FileRead {
  @PrimaryColumn()
  file_id!: number;

  @PrimaryColumn()
  process_version_id!: number;

  @ManyToOne(() => File)
  @JoinColumn({ name: "file_id" })
  file!: File;

  @Index("idx_file_reads_file_version")
  @ManyToOne(() => FileVersion, { nullable: true })
  @JoinColumn({ name: "file_version_id" })
  fileVersion!: FileVersion;


  @Index("idx_file_reads_process_version")
  @ManyToOne(() => ProcessVersion)
  @JoinColumn({ name: "process_version_id" })
  processVersion!: ProcessVersion;

  @Column({ type: "datetime", name: "created_at" })
  created_at!: Date;
}
