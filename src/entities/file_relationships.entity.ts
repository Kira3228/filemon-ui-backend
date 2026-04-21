import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("file_relationships")
export class FileRelationship {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "parent_file_id" })
  parentFileId: number;

  @Column({ name: "child_file_id" })
  childFileId: number;

  @Column({ name: "relationship_type", nullable: true })
  relationshipType: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "process_version_id", nullable: true })
  processVersionId: number;
}
