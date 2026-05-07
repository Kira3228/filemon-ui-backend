import {
  Column, CreateDateColumn, Entity, Index,
  JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique,
} from "typeorm";
import { File } from "./file.entity";
import { ProcessVersion } from "./process-version";

@Entity("file_versions")
@Unique(["file", "version_number"])
export class FileVersion {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => File, (file) => file.versions)
  @JoinColumn({ name: "file_id" })
  file!: File;

  // убираем @Column() file_id

  @Column()
  version_number!: number;

  @Index("idx_file_versions_origin_pv")
  @ManyToOne(() => ProcessVersion, { nullable: true }) // ← nullable: true
  @JoinColumn({ name: "origin_process_version_id" })
  originProcessVersion!: ProcessVersion | null;

  // убираем @Column() origin_process_version_id

  @Column({ type: "integer", nullable: true })
  depth!: number | null;

  @CreateDateColumn()
  created_at!: Date;
}
