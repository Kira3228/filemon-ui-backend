import {
  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn,
} from "typeorm";

@Entity("monitored_files")
export class MonitoredFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "filesystem_id", nullable: true })
  filesystemId: string;

  @Column({ nullable: true })
  inode: number;

  @Column({ name: "file_path" })
  filePath: string;

  @Column({ name: "file_name", nullable: true })
  fileName: string;

  @Column({ name: "file_size", nullable: true })
  fileSize: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "modified_at", type: "datetime", nullable: true })
  modifiedAt: Date;

  @Column({ name: "is_original_marked", default: false })
  isOriginalMarked: boolean;

  @Column({ name: "max_chain_depth", nullable: true })
  maxChainDepth: number;

  @Column({ name: "min_chain_depth", nullable: true })
  minChainDepth: number;

  @Column({ nullable: true })
  status: string;

  @Column({ name: "extended_attributes", type: "text", nullable: true })
  extendedAttributes: string;
}
