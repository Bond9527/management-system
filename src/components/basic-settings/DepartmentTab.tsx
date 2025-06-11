import { useState } from "react";
import { Input, Button, Card, CardBody } from "@heroui/react";
import { SearchIcon } from "@/components/icons";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

interface DepartmentNode {
  name: string;
  children: DepartmentNode[];
}

// 优化后的部门树数据，所有节点都加 children: []
const initialDepartmentTree = [
  {
    name: "股东会",
    children: [
      {
        name: "董事会",
        children: [
          {
            name: "总办",
            children: [
              { name: "财务部", children: [] },
              {
                name: "市场部",
                children: [
                  {
                    name: "华东市场部",
                    children: [
                      { name: "上海市场部", children: [] },
                    ],
                  },
                  { name: "华南市场部", children: [] },
                  {
                    name: "西北市场部",
                    children: [
                      {
                        name: "贵阳市场",
                        children: [
                          { name: "乌当区市场", children: [] },
                        ],
                      },
                    ],
                  },
                ],
              },
              { name: "技术部", children: [] },
              { name: "运维部", children: [] },
            ],
          },
        ],
      },
    ],
  },
];

function cloneTree(tree: DepartmentNode[]): DepartmentNode[] {
  return JSON.parse(JSON.stringify(tree));
}

function addDepartment(tree: DepartmentNode[], pathArr: string[], newName: string): DepartmentNode[] {
  if (pathArr.length === 0) return tree;
  const [head, ...rest] = pathArr;
  return tree.map(node => {
    if (node.name === head) {
      if (rest.length === 0) {
        // 在当前节点下添加
        return {
          ...node,
          children: [...node.children, { name: newName, children: [] }],
        };
      } else {
        return {
          ...node,
          children: addDepartment(node.children, rest, newName),
        };
      }
    }
    return node;
  });
}

function deleteDepartment(tree: DepartmentNode[], pathArr: string[]): DepartmentNode[] {
  if (pathArr.length === 0) return tree;
  const [head, ...rest] = pathArr;
  return tree
    .map(node => {
      if (node.name === head) {
        if (rest.length === 0) {
          // 删除当前节点（由父节点处理）
          return null;
        } else {
          return {
            ...node,
            children: deleteDepartment(node.children, rest),
          };
        }
      }
      return node;
    })
    .filter((node): node is DepartmentNode => node !== null);
}

interface DepartmentNodeProps {
  node: DepartmentNode;
  path?: string;
  depth?: number;
  onAdd: (pathArr: string[], newName: string) => void;
  onDelete: (pathArr: string[]) => void;
  isRoot?: boolean;
}

function DepartmentNode({ node, path = "", depth = 0, onAdd, onDelete, isRoot = false }: DepartmentNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const nodePath = path ? `${path}/${node.name}` : node.name;
  const pathArr = nodePath.split("/");

  const validateForm = () => {
    const errors: { name?: string } = {};
    if (!newDepartmentName.trim()) {
      errors.name = "部门名称不能为空";
    } else if (newDepartmentName.length > 50) {
      errors.name = "部门名称不能超过50个字符";
    } else if (node.children.some(child => child.name === newDepartmentName.trim())) {
      errors.name = "同级部门名称不能重复";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
    if (validateForm()) {
      onAdd(pathArr, newDepartmentName.trim());
      setNewDepartmentName("");
      setShowAddModal(false);
      setFormErrors({});
    }
  };

  const handleDelete = () => {
    onDelete(pathArr);
    setShowDeleteModal(false);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between w-full py-0.5">
        <div className="flex items-center min-w-0" style={{ paddingLeft: depth * 24 }}>
          {hasChildren && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mr-1 focus:outline-none"
              style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label={expanded ? "收起" : "展开"}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
              >
                <polygon points="3,2 10,6 3,10" fill="#888" />
              </svg>
            </button>
          )}
          <span className="truncate">{node.name}</span>
        </div>
        <div className="flex-shrink-0 flex gap-2">
          <Button size="sm" color="primary" variant="flat" onClick={() => setShowAddModal(true)}>添加部门</Button>
          {!isRoot && (
            <Button size="sm" color="danger" variant="flat" onClick={() => setShowDeleteModal(true)}>删除部门</Button>
          )}
        </div>
      </div>
      {hasChildren && expanded && (
        <div className="w-full">
          {node.children.map((child, idx) => (
            <DepartmentNode
              node={child}
              key={idx}
              path={nodePath}
              depth={depth + 1}
              onAdd={onAdd}
              onDelete={onDelete}
              isRoot={false}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalContent>
          <ModalHeader>确认删除</ModalHeader>
          <ModalBody>
            确定要删除部门 "{node.name}" 吗？此操作不可恢复。
            {hasChildren && (
              <div className="mt-2 text-danger">
                注意：该部门下还有 {node.children.length} 个子部门，删除后将一并删除。
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onClick={() => setShowDeleteModal(false)}>
              取消
            </Button>
            <Button color="danger" onClick={handleDelete}>
              确认删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Department Modal */}
      <Modal isOpen={showAddModal} onClose={() => {
        setShowAddModal(false);
        setNewDepartmentName("");
        setFormErrors({});
      }}>
        <ModalContent>
          <ModalHeader>添加部门</ModalHeader>
          <ModalBody>
            <Input
              label="部门名称"
              placeholder="请输入部门名称"
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              errorMessage={formErrors.name}
              maxLength={50}
              description="最多50个字符"
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onClick={() => {
              setShowAddModal(false);
              setNewDepartmentName("");
              setFormErrors({});
            }}>
              取消
            </Button>
            <Button 
              color="primary" 
              onClick={handleAdd}
              isDisabled={!newDepartmentName.trim()}
            >
              确认添加
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default function DepartmentTab() {
  const [search, setSearch] = useState("");
  const [tree, setTree] = useState<DepartmentNode[]>(initialDepartmentTree);

  const filteredTree = tree.filter(dep => dep.name.includes(search));

  const handleAdd = (pathArr: string[], newName: string) => {
    setTree(prev => addDepartment(cloneTree(prev), pathArr, newName));
  };

  const handleDelete = (pathArr: string[]) => {
    setTree(prev => deleteDepartment(cloneTree(prev), pathArr));
  };

  return (
    <Card>
      <CardBody>
        <div className="max-w-6xl">
          <div className="max-w-2xl">
            <Input
              placeholder="请输入部门名称进行搜索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-4 w-full"
              startContent={<SearchIcon className="text-base text-gray-400 pointer-events-none flex-shrink-0" />}
            />
          </div>
          <div className="bg-white rounded-xl p-4">
            {(search ? filteredTree : tree).map((node, idx) => (
              <DepartmentNode
                node={node}
                key={idx}
                path=""
                depth={0}
                onAdd={handleAdd}
                onDelete={handleDelete}
                isRoot={true}
              />
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
} 