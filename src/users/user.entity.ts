import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Project } from "../projects/project.entity";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: "hashedPassword" })
  hashedPassword!: string;

  @Column({
    name: "displayedName",
    type: "varchar",
    nullable: true,
  })
  displayedName!: string | null;

  @OneToMany(
    () => Project,
    (project) => project.owner,
  )
  projects!: Project[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}