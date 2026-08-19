import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Project } from "../projects/project.entity";
import { User } from "../users/user.entity";
import { ProjectMemberRole } from "../project-members/project-member.entity";

@Entity({ name: "project_invites" })
export class ProjectInvite {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  projectId!: string;

  @Column({ type: "uuid" })
  createdByUserId!: string;

  @Column({ unique: true })
  token!: string;

  @Column({
    type: "enum",
    enum: ProjectMemberRole,
  })
  role!: ProjectMemberRole;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @Column({ default: false })
  revoked!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => Project, {
    onDelete: "CASCADE",
  })
  project!: Project;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  createdBy!: User;
}